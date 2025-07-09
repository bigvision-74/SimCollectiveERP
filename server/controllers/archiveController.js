const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

exports.allArchiveData = async (req, res) => {
  try {
    const userData = await knex("users")
      .andWhere({ user_deleted: 1 })
      .orWhere({ org_delete: 1 });


    const orgData = await knex("organisations").where({
      organisation_deleted: "deleted",
    });

    res.status(200).json({
      userData,
      orgData,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error getting archive data" });
  }
};

exports.permanentDelete = async (req, res) => {
  const { id, type } = req.query;

  if (!id || !type) {
    return res
      .status(400)
      .send({ message: "Both id and type parameters are required" });
  }

  const ids = Array.isArray(id) ? id : [id];

  try {
    switch (type) {
      case "user":
        await knex("users").whereIn("id", ids).delete();
        break;
      case "org":
        await knex.transaction(async (trx) => {
          const courseIds = await trx("courses1")
            .whereIn("organisation_id", ids)
            .pluck("id");

          if (courseIds.length) {
            await trx("course_contents")
              .whereIn("course_id", courseIds)
              .delete();
            await trx("quiz_tb").whereIn("course_id", courseIds).delete();
            await trx("modules").whereIn("course_id", courseIds).delete();
            await trx("video_modules").whereIn("course_id", courseIds).delete();

            await trx("courses1").whereIn("id", courseIds).delete();
          }

          await trx("devices_names").whereIn("organisation_id", ids).delete();
          await trx("users").whereIn("organisation_id", ids).delete();
          await trx("organisations").whereIn("id", ids).delete();
        });

        break;
      default:
        return res.status(400).send({ message: "Invalid type specified" });
    }

    res.status(200).send({ message: "Deletion successful" });
  } catch (error) {
    console.error("Error deleting data:", error);
    res.status(500).send({ message: "Error deleting data" });
  }
};

exports.recoverData = async (req, res) => {
  const { id, type } = req.query;
console.log(id, "id");
console.log(type, "type");
  if (!id || !type) {
    return res
      .status(400)
      .send({ message: "Both id and type parameters are required" });
  }
  try {
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
        break;
      default:
        return res.status(400).send({ message: "Invalid type specified" });
    }

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
