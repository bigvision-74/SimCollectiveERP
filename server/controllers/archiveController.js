const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");

exports.allArchiveData = async (req, res) => {
  try {
    const userData = await knex("users")
      .andWhere({ user_deleted: 1 })
      .orWhere({ org_delete: 1 });

    const orgData = await knex("organisations").where({
      organisation_deleted: "deleted",
    });

    const patientData = await knex("patient_records")
      .whereNotNull("deleted_at")
      .select(
        "name",
        "email",
        "organisation_id",
        "gender",
        "id",
        "phone",
        "date_of_birth"
      );

    res.status(200).json({
      userData,
      orgData,
      patientData,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error getting archive data" });
  }
};

exports.permanentDelete = async (req, res) => {
  const { id, type, performerId } = req.query;

  if (!id || !type) {
    return res
      .status(400)
      .send({ message: "Both id and type parameters are required" });
  }

  const ids = Array.isArray(id) ? id : [id];
  const userId = performerId || 1;

  try {
    let recordsToLog = [];
    let entityName = "";

    // 1. Fetch metadata before permanent deletion for the activity log
    switch (type) {
      case "user":
        entityName = "User";
        recordsToLog = await knex("users")
          .whereIn("id", ids)
          .select("id", "fname", "lname", "uemail", "token");
        break;
      case "patient":
        entityName = "Patient";
        recordsToLog = await knex("patient_records")
          .whereIn("id", ids)
          .select("id", "name", "email");
        break;
      case "org":
        entityName = "Organisation";
        recordsToLog = await knex("organisations")
          .whereIn("id", ids)
          .select("id", "name", "org_email");
        break;
    }

    if (recordsToLog.length === 0) {
      return res.status(404).send({ message: "No records found to delete" });
    }

    // 2. Perform the deletions
    switch (type) {
      case "user":
        // Delete from Firebase Auth
        for (const user of recordsToLog) {
          if (user.token) {
            try {
              await admin.auth().deleteUser(user.token);
            } catch (err) {
              console.error(`Failed to delete Firebase user ${user.token}:`, err);
            }
          }
        }
        await knex("users").whereIn("id", ids).delete();
        break;

      case "patient":
        await knex("patient_records").whereIn("id", ids).delete();
        break;

      case "org":
        await knex.transaction(async (trx) => {
          await trx("users").whereIn("organisation_id", ids).delete();
          await trx("organisations").whereIn("id", ids).delete();
          await trx("patient_records").whereIn("organisation_id", ids).delete();
          await trx("request_investigation").whereIn("organisation_id", ids).delete();
          await trx("investigation_reports").whereIn("organisation_id", ids).delete();
        });
        break;

      default:
        return res.status(400).send({ message: "Invalid type specified" });
    }

    // 3. --- ACTIVITY LOG START ---
    try {
      const logEntries = recordsToLog.map((record) => {
        let displayName = "";
        let displayEmail = "";

        if (type === "user") {
          displayName = `${record.fname} ${record.lname}`;
          displayEmail = record.uemail;
        } else {
          displayName = record.name;
          displayEmail = record.email || record.org_email;
        }

        return {
          user_id: userId,
          action_type: "DELETE",
          entity_name: entityName,
          entity_id: record.id,
          details: JSON.stringify({
            data: {
              name: displayName,
              uemail: displayEmail || "N/A",
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        };
      });

      if (logEntries.length > 0) {
        await knex("activity_logs").insert(logEntries);
      }
    } catch (logError) {
      console.error("Activity log failed for permanentDelete:", logError);
    }
    // --- ACTIVITY LOG END ---

    res.status(200).send({ message: "Deletion successful" });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).send({ message: "Error deleting data" });
  }
};

exports.recoverData = async (req, res) => {
  const { id, type, performerId } = req.query;

  if (!id || !type) {
    return res
      .status(400)
      .send({ message: "Both id and type parameters are required" });
  }

  try {
    let entityName = "";
    let recordDetails = null;

    // 1. Fetch record details before recovery for the activity log
    if (type === "user") {
      entityName = "User";
      recordDetails = await knex("users").where("id", id).first();
    } else if (type === "org") {
      entityName = "Organisation";
      recordDetails = await knex("organisations").where("id", id).first();
    } else if (type === "patient") {
      entityName = "Patient";
      recordDetails = await knex("patient_records").where("id", id).first();
    }

    if (!recordDetails) {
      return res.status(404).send({ message: "Record not found" });
    }

    // 2. Perform the recovery update
    switch (type) {
      case "user":
        await knex("users")
          .where("id", id)
          .update({ user_deleted: null, org_delete: null });
        break;
      case "org":
        await knex("organisations")
          .where("id", id)
          .update({ organisation_deleted: null });
        await knex("patient_records")
          .where("organisation_id", id)
          .update({ deleted_at: null });
        break;
      case "patient":
        await knex("patient_records")
          .where("id", id)
          .update({ deleted_at: null });
        break;
      default:
        return res.status(400).send({ message: "Invalid type specified" });
    }

    // --- ACTIVITY LOG START ---
    try {
      await knex("activity_logs").insert({
        user_id: performerId || 1,
        action_type: "UPDATE",
        entity_name: entityName,
        entity_id: id,
        details: JSON.stringify({
          changes: {
            status: {
              old: "Deleted",
              new: "Restored",
            },
            name: {
              old: recordDetails.name || recordDetails.fname || "N/A",
              new: recordDetails.name || recordDetails.fname || "N/A",
            },
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for recoverData:", logError);
    }
    // --- ACTIVITY LOG END ---

    res.status(200).send({ message: "Recovery successful" });
  } catch (error) {
    console.error("Error recovering data:", error);
    res.status(500).send({ message: "Error recovering data" });
  }
};

exports.updateDataOrg = async (req, res) => {
  const { id, org, type } = req.body;
  try {
    if (type == "user") {
      await knex("users")
        .where("id", id)
        .update({ organisation_id: org, org_delete: null, user_deleted: null });
    } else {
      await knex("courses1").where("id", id).update({
        organisation_id: org,
        org_delete: null,
        course_deleted: null,
      });
    }

    res.status(200).send({ message: "Organisation updated successfully" });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send({ message: "Error updating organisation" });
  }
};

exports.updateModuleCourse = async (req, res) => {
  const { id, course, type } = req.body;
  try {
    if (type == "video") {
      await knex("video_modules").where("id", id).update({
        course_id: course,
        courseId_deleted: null,
        videoModule_deleted: null,
      });
    } else {
      await knex("modules").where("id", id).update({
        course_id: course,
        courseId_deleted: null,
        module_deleted: null,
      });
    }

    res.status(200).send({ message: "Modules updated successfully" });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send({ message: "Error updating Modules" });
  }
};

exports.updateModuleCourse = async (req, res) => {
  const { id, course, type } = req.body;
  try {
    if (type == "video") {
      await knex("video_modules").where("id", id).update({
        course_id: course,
        courseId_deleted: null,
        videoModule_deleted: null,
      });
    } else {
      await knex("modules").where("id", id).update({
        course_id: course,
        courseId_deleted: null,
        module_deleted: null,
      });
    }

    res.status(200).send({ message: "Modules updated successfully" });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send({ message: "Error updating Modules" });
  }
};

exports.updateLessonModule = async (req, res) => {
  const { id, module } = req.body;
  try {
    await knex("lesson_video").where("id", id).update({
      chapter_id: module,
      lesson_deleted: null,
      module_deleted: null,
    });

    res.status(200).send({ message: "Modules updated successfully" });
  } catch (error) {
    console.log("Error", error);
    res.status(500).send({ message: "Error updating Modules" });
  }
};

exports.getAllVideoModules = async (req, res) => {
  try {
    const data = await knex("video_modules")
      .where(function () {
        this.where("videoModule_deleted", "<>", 1)
          .orWhereNull("videoModule_deleted")
          .orWhere("videoModule_deleted", "");
      })
      .andWhere(function () {
        this.where("courseId_deleted", "<>", 1)
          .orWhereNull("courseId_deleted")
          .orWhere("courseId_deleted", "");
      });

    res.status(200).send(data);
  } catch (error) {
    console.log("Error", error);
    res.status(500).send({ message: "Error updating Modules" });
  }
};
