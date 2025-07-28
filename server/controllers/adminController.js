const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const path = require("path");
const bcrypt = require("bcrypt");
// const admin = require("firebase-admin");
const { defaultApp } = require("../firebase");
const sendMail = require("../helpers/mailHelper");
require("dotenv").config();
const moment = require("moment");
const fs = require("fs");
const ejs = require("ejs");
const contactEmail = fs.readFileSync(
  "./EmailTemplates/ContactMail.ejs",
  "utf8"
);
const compiledContact = ejs.compile(contactEmail);

exports.getStatsAndCount = async (req, res) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const userData = await knex("users")
      .where({ username: username })
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      })
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      })
      .first();

    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    const orgData = await knex("organisations")
      .where({ id: userData.organisation_id })
      .first();

    if (!orgData) {
      return res
        .status(404)
        .json({ message: "Organisation not found for the given user." });
    }

    const orgId = userData.organisation_id;

    const [userCount, courseCount, deviceCount] = await Promise.all([
      knex("users")
        .where({ organisation_id: orgId })
        .andWhere(function () {
          this.where("user_deleted", "0")
            .orWhereNull("user_deleted")
            .orWhere("user_deleted", "");
        })
        .andWhere(function () {
          this.where("users.user_deleted", "<>", 1)
            .orWhereNull("users.user_deleted")
            .orWhere("users.user_deleted", "")
            .orWhere("users.user_deleted", "<>", "");
        })
        .andWhere(function () {
          this.where("users.org_delete", "<>", 1)
            .orWhereNull("users.org_delete")
            .orWhere("users.org_delete", "")
            .orWhere("users.org_delete", "<>", "");
        })
        .groupBy("organisation_id")
        .select(
          knex.raw('count(case when role = "worker" then 1 end) as userCount'),
          knex.raw(
            'count(case when role = "manager" then 1 end) as managerCount'
          ),
          knex.raw('count(case when role = "admin" then 1 end) as adminCount')
        ),
      knex("courses1")
        .where({ organisation_id: orgId })
        .andWhere(function () {
          this.where("course_deleted", "0").orWhereNull("course_deleted");
        })
        .andWhere(function () {
          this.where("course_deleted", "<>", 1)
            .orWhereNull("course_deleted")
            .orWhere("course_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .count("* as count"),
      knex("devices_names")
        .where({ organisation_id: orgId })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .count("* as count"),
    ]);

    const stats = {
      allUserCount:
        parseInt(userCount[0].userCount, 10) +
        parseInt(userCount[0].managerCount, 10) +
        parseInt(userCount[0].adminCount, 10),
      userCount: parseInt(userCount[0].userCount, 10),
      managerCount: parseInt(userCount[0].managerCount, 10),
      adminCount: parseInt(userCount[0].adminCount, 10),
      courseCount: parseInt(courseCount[0].count, 10),
      deviceCount: parseInt(deviceCount[0].count, 10),
    };

    res.status(200).json({
      orgData,
      stats,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error getting statistics" });
  }
};

exports.getFacultiesById = async (req, res) => {
  const orgId = req.params.orgId;
  if (!orgId) {
    return res.status(400).json({ message: "orgId is required." });
  }
  try {
    const userData = await knex("users")
      .select("users.*")
      .where({
        organisation_id: orgId,
        role: "Faculty",
      });

    if (!userData) {
      return res
        .status(404)
        .json({ message: "User or organisation not found." });
    }
    return res.status(200).send(userData);
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error getting organisation" });
  }
};

exports.getorganisation = async (req, res) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ message: "email is required." });
  }

  try {
    const userData = await knex("users")
      .leftJoin("organisations", "users.organisation_id", "organisations.id")
      .select(
        "users.*",
        "users.id as uid",
        "organisations.org_email",
        "organisations.organisation_icon",
        "organisations.organisation_deleted",
        "organisations.name",
        "organisations.id as orgid"
      )
      .where({ "users.uemail": username })
      .andWhere(function () {
        this.where("users.user_deleted", "<>", 1)
          .orWhereNull("users.user_deleted")
          .orWhere("users.user_deleted", "");
      })
      .andWhere(function () {
        this.where("users.org_delete", "<>", 1)
          .orWhereNull("users.org_delete")
          .orWhere("users.org_delete", "");
      })
      .andWhere(function () {
        this.where("organisations.organisation_deleted", "<>", 1)
          .orWhereNull("organisations.organisation_deleted")
          .orWhere("organisations.organisation_deleted", "");
      })
      .first();

    if (!userData) {
      return res
        .status(404)
        .json({ message: "User or organisation not found." });
    }
    return res.status(200).send(userData);
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error getting organisation" });
  }
};

exports.getUserActivity = async (req, res) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const userData = await knex("users").where({ username }).first();

    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    const { role, organisation_id, id } = userData;

    if (role === "Superadmin") {
      const userActivity = await knex("user_activities")
        .join("users", "users.id", "=", "user_activities.userid")
        .select("users.fname", "users.lname", "user_activities.*");

      return res.status(200).json(userActivity);
    } else {
      let userActivityQuery = knex("user_activities")
        .join("users", "users.id", "=", "user_activities.userid")
        .select("users.fname", "users.lname", "user_activities.*")
        .where({ "user_activities.organisation_id": organisation_id });

      if (role !== "admin" && role !== "manager") {
        userActivityQuery = userActivityQuery.andWhere({ userid: id });
      }

      const userActivity = await userActivityQuery;

      return res.status(200).json(userActivity);
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Error getting user activity" });
  }
};

exports.getUserCourse = async (req, res) => {
  const username = req.params.username;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const userData = await knex("users")
      .where({ username })
      .orWhere({ id: username })
      .first();

    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    const userCourses = await knex("course_assigned")
      .join("courses1", "course_assigned.course_id", "courses1.id")
      .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
      .leftJoin("modules", "courses1.id", "modules.course_id")
      .where({ user_id: userData.id })
      .andWhere(function () {
        this.where("courses1.course_deleted", "<>", 1)
          .orWhereNull("courses1.course_deleted")
          .orWhere("courses1.course_deleted", "");
      })
      .andWhere(function () {
        this.where("courses1.org_delete", "<>", 1)
          .orWhereNull("courses1.org_delete")
          .orWhere("courses1.org_delete", "");
      })
      .andWhere(function () {
        this.where("modules.module_deleted", "<>", 1)
          .orWhereNull("modules.module_deleted")
          .orWhere("modules.module_deleted", "");
      })
      .andWhere(function () {
        this.where("modules.courseId_deleted", "<>", 1)
          .orWhereNull("modules.courseId_deleted")
          .orWhere("modules.courseId_deleted", "");
      })
      .select(
        "course_assigned.status",
        "course_assigned.start_date",
        "course_assigned.end_date",
        "courses1.id",
        "courses1.level",
        "courses1.organisation_id",
        "course_contents.lang_code",
        "course_contents.course_description",
        "course_contents.course_thumbnail",
        "course_contents.pdf",
        "course_contents.course_video",
        "course_contents.about_course",
        "course_contents.duration_time",
        "course_contents.name",
        "course_contents.category",
        "course_contents.learning_outcomes",
        "course_contents.id as contentId"
      )
      .count("modules.id as module_count")
      .groupBy(
        "course_assigned.status",
        "course_assigned.start_date",
        "course_assigned.end_date",
        "courses1.id",
        "courses1.level",
        "courses1.organisation_id",
        "course_contents.lang_code",
        "course_contents.course_description",
        "course_contents.course_thumbnail",
        "course_contents.pdf",
        "course_contents.course_video",
        "course_contents.about_course",
        "course_contents.duration_time",
        "course_contents.name",
        "course_contents.category",
        "course_contents.learning_outcomes",
        "course_contents.id"
      );

    if (userCourses.length === 0) {
      return res
        .status(404)
        .json({ message: "No courses assigned to this user." });
    }

    const formattedCourses = [];

    for (const course of userCourses) {
      let progress = 0;
      const modules = await knex("modules")
        .where({ course_id: course.id })
        .select("id");

      if (modules.length > 0) {
        const [completedModulesResult, totalModulesResult] = await Promise.all([
          knex("scenario_progress")
            .count("* as completedVirtualModules")
            .where("userid", userData.id)
            .where("uni_course_id", course.id)
            .where("progress", "100")
            .first(),
          knex("modules")
            .count("* as totalVirtualModules")
            .where("course_id", course.id)
            .first(),
        ]);

        const completedModules = parseInt(
          completedModulesResult.completedVirtualModules || 0,
          10
        );
        const totalModules = parseInt(
          totalModulesResult.totalVirtualModules || 0,
          10
        );

        progress =
          totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
      }

      let existingCourse = formattedCourses.find((c) => c.id == course.id);

      if (!existingCourse) {
        existingCourse = {
          id: course.id,
          level: course.level,
          organisation_id: course.organisation_id,
          progress: Math.round(progress),
          status: course.status,
          start_date: course.start_date,
          end_date: course.end_date,
          totalModules: course.module_count,
          data: [],
        };
        formattedCourses.push(existingCourse);
      }

      existingCourse.data.push({
        id: course.contentId,
        name: course.name,
        language: course.lang_code,
        category: course.category,
        content: course.course_description,
        outcomes: course.learning_outcomes,
        description: course.course_description,
        about: course.about_course,
        duration: course.duration_time,
        course_thumbnail: course.course_thumbnail,
        pdf: course.pdf,
        video: course.course_video,
      });
    }

    return res.status(200).json(formattedCourses);
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({ message: "Error getting user course" });
  }
};

exports.resetPassword = async (req, res) => {
  const { username, newPassword } = req.body;
console.log(req.body)
  try {
    const user = await knex("users").where({ username: username }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    let firebaseUid;
    if (user.password == 0 || user.password == null || user.token == null) {
      try {
        const firebaseUser = await defaultApp.auth().createUser({
          email: user.uemail,
          password: newPassword,
        });
        firebaseUid = firebaseUser.uid;
        await knex("users")
          .where({ id: user.id })
          .update({ password: hashedNewPassword, token: firebaseUid });
      } catch (firebaseError) {
        return res
          .status(500)
          .json({ message: "Failed to create user on Firebase" });
      }

      return res.status(200).json({ message: "User created successfully" });
    }

    if (user.token && user.password != 0) {
      try {
        await defaultApp.auth().updateUser(user.token, {
          password: newPassword,
        });
      } catch (firebaseError) {
        console.error("Error updating Firebase user:", firebaseError);
        return res
          .status(500)
          .json({ message: "Failed to update user on Firebase" });
      }
    }
    await knex("users")
      .where({ id: user.id })
      .update({ password: hashedNewPassword, token: firebaseUid });
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error: ", error);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

// exports.resetPassword = async (req, res) => {
//   const { username, newPassword } = req.body;

//   try {
//     const user = await knex("users").where({ username }).first();
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const hashedNewPassword = await bcrypt.hash(newPassword, 10);

//     if (user.token) {
//       try {
//         await defaultApp.auth().updateUser(user.token, {
//           password: newPassword
//         });
//       } catch (firebaseError) {
//         console.error("Firebase update error:", firebaseError);
//         return res
//           .status(500)
//           .json({ message: "Failed to update Firebase password" });
//       }
//     }

//     await knex("users")
//       .where({ id: user.id })
//       .update({ password: hashedNewPassword });

//     return res.status(200).json({ message: "Password reset successfully" });
//   } catch (error) {
//     console.error("Password reset error:", error);
//     return res.status(500).json({ message: "Error resetting password" });
//   }
// };

exports.addNotifications = async (req, res) => {
  try {
    const { notify_by, message, notify_to, title } = req.body;

    if (!notify_by || !message || !notify_to) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const notifyToArray = Array.isArray(notify_to) ? notify_to : [notify_to];

    const sender = await knex("users").where({ uemail: notify_by }).first();

    if (!sender) {
      return res.status(404).json({ message: "Sender user not found" });
    }

    // Determine if we're dealing with IDs or usernames
    const isUsingIds = notifyToArray.every(
      (item) => typeof item === "number" || /^\d+$/.test(item)
    );

    let recipients;

    if (isUsingIds) {
      // Look up by ID
      recipients = await knex("users")
        .whereIn(
          "id",
          notifyToArray.map((id) => Number(id))
        )
        .select("id", "username");
    } else {
      recipients = await knex("users")
        .whereIn("username", notifyToArray)
        .select("id", "username");
    }

    // Skip invalid recipients (no error)
    if (recipients.length === 0) {
      return res.status(200).json({
        message: "No valid recipients found",
        count: 0,
        recipients: [],
      });
    }

    const notifications = recipients.map((recipient) => ({
      notify_by: sender.id,
      notify_to: recipient.id,
      message,
      title,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await knex.transaction(async (trx) => {
      await trx("notifications").insert(notifications);
    });

    res.status(201).json({
      message: "Notifications created successfully",
      count: notifications.length,
      recipients: recipients.map((r) => (isUsingIds ? r.id : r.username)),
      skipped: notifyToArray.length - recipients.length, // Number of skipped invalid users
    });
  } catch (error) {
    console.error("Error creating notifications:", error);
    res.status(500).json({ message: "Error creating notifications" });
  }
};

// display all notifactio base of role function 
exports.allNotifications = async (req, res) => {
  const { username: email } = req.params;
  try {
    const user = await knex("users")
      .where({ uemail: email })
      .select("id", "role")
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let notificationsQuery = knex("notifications")
      .join("users as sender", "sender.id", "=", "notifications.notify_by")
      .join("users as receiver", "receiver.id", "=", "notifications.notify_to")
      .orderBy("notifications.id", "desc")
      .select(
        "notifications.id as notification_id",
        "notifications.notify_to",
        "notifications.notify_by",
        "notifications.title",
        "notifications.message",
        "notifications.status",
        "notifications.created_at as notification_created_at",
        knex.raw("CONCAT(sender.fname, ' ', sender.lname) as notify_by_name"),
        knex.raw("CONCAT(receiver.fname, ' ', receiver.lname) as notify_to_name"),
        "sender.user_thumbnail as notify_by_photo" // ✅ Add this
      );


    // if (user.role !== "Superadmin") {
      notificationsQuery = notificationsQuery.where(
        "notifications.notify_to",
        user.id
      );
    // }

    const notifications = await notificationsQuery;

    return res.status(200).json(notifications.length > 0 ? notifications : []);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// exports.allNotifications = async (req, res) => {
//   // const { username } = req.params;
//   const { username: email } = req.params;
//   try {
//     const user = await knex("users")
//       .where({ uemail: email })
//       .select("id", "role")
//       .first();

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     let notificationsQuery = knex("notifications")
//       .join("users", "users.id", "=", "notifications.notify_by")
//       .orderBy("notifications.id", "desc")
//       .select("users.*", "notifications.*");

//     if (user.role !== "Superadmin") {
//       notificationsQuery = notificationsQuery.where(
//         "notifications.notify_to",
//         user.id
//       );
//     }

//     const notifications = await notificationsQuery;

//     const updatedNotifications = notifications.map((notification) => {
//       return notification;
//     });

//     return res.status(200).json(updatedNotifications.length > 0 ? updatedNotifications : []);
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     return res.status(500).json({ message: "Error fetching notifications" });
//   }
// };

// exports.deleteAllNotifications = async (req, res) => {
//   const { username } = req.params;

//   try {
//     const user = await knex("users")
//       .where({ username })
//       .select("id", "role")
//       .first();

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     let deleteQuery = knex("notifications");

//     if (user.role === "Superadmin") {
//       deleteQuery = deleteQuery.where("notify_to", 1);
//     } else {
//       deleteQuery = deleteQuery.where("notify_to", user.id);
//     }

//     const deletedCount = await deleteQuery.del();

//     return res.status(200).json({
//       message: "All notifications cleared successfully",
//       count: deletedCount
//     });

//   } catch (error) {
//     console.error("Error deleting notifications:", error);
//     return res.status(500).json({ message: "Error clearing notifications" });
//   }
// };

exports.deleteNotifications = async (req, res) => {
  const { ids } = req.params;

  try {
    let deleteQuery = knex("notifications");

    if (ids) {
      const idsArray =
        typeof ids === "string" ? ids.split(",").map(Number) : [Number(ids)];
      deleteQuery = deleteQuery.whereIn("id", idsArray);
    }

    const deletedCount = await deleteQuery.del();

    return res.status(200).json({
      success: true,
      message: "Notifications deleted successfully",
      count: deletedCount,
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting notifications",
    });
  }
};

// update  unseen and seen notifaction value  function 
exports.updateNotifications = async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ message: "No notification IDs provided." });
  }

  const notificationIds = ids.split(",").map((id) => parseInt(id));

  try {
    const updatedCount = await knex("notifications")
      .whereIn("id", notificationIds)
      .update({ status: "seen" });

    return res
      .status(200)
      .json({ message: "Notifications updated successfully.", updatedCount });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


exports.getSearchData = async (req, res) => {
  const query = req.query.query;
  const username = req.query.username;

  const userIdResult = await knex("users")
    .select("id")
    .where("username", username)
    .andWhere(function () {
      this.where("user_deleted", "<>", 1)
        .orWhereNull("user_deleted")
        .orWhere("user_deleted", "");
    })
    .andWhere(function () {
      this.where("org_delete", "<>", 1)
        .orWhereNull("org_delete")
        .orWhere("org_delete", "");
    })
    .first();

  const userId = userIdResult.id;
  try {
    const lowerCaseQuery = String(query).toLowerCase();
    const finalResult = [];

    if (req.query.role === "worker") {
      const assignedCoursesResult = await knex("course_assigned")
        .join("courses1", "course_assigned.course_id", "courses1.id")
        .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
        .andWhere(function () {
          this.where("courses1.course_deleted", "<>", 1)
            .orWhereNull("courses1.course_deleted")
            .orWhere("courses1.course_deleted", "");
        })
        .andWhere(function () {
          this.where("courses1.org_delete", "<>", 1)
            .orWhereNull("courses1.org_delete")
            .orWhere("courses1.org_delete", "");
        })
        .andWhere(function () {
          this.where("course_assigned.userid_deleted", "<>", 1)
            .orWhereNull("course_assigned.userid_deleted")
            .orWhere("course_assigned.userid_deleted", "");
        })
        .andWhere(function () {
          this.where("course_assigned.courseId_deleted", "<>", 1)
            .orWhereNull("course_assigned.courseId_deleted")
            .orWhere("course_assigned.courseId_deleted", "");
        })
        .where({ user_id: userId })
        .andWhere(function () {
          this.whereRaw(`LOWER(name) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(category) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(level) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "courses1.id",
          "course_contents.course_thumbnail",
          "course_contents.category",
          "course_contents.name",
          knex.raw(`'courses1' as table_name`)
        );

      assignedCoursesResult.forEach((course) => {
        finalResult.push({
          table_name: "courses1",
          matched_query: course.name,
          image_field: course.course_thumbnail,
          category: course.category,
        });
      });

      const courses = await knex("course_assigned")
        .join("courses1", "course_assigned.course_id", "courses1.id")
        .andWhere(function () {
          this.where("courses1.course_deleted", "<>", 1)
            .orWhereNull("courses1.course_deleted")
            .orWhere("courses1.course_deleted", "");
        })
        .andWhere(function () {
          this.where("courses1.org_delete", "<>", 1)
            .orWhereNull("courses1.org_delete")
            .orWhere("courses1.org_delete", "");
        })
        .andWhere(function () {
          this.where("course_assigned.userid_deleted", "<>", 1)
            .orWhereNull("course_assigned.userid_deleted")
            .orWhere("course_assigned.userid_deleted", "");
        })
        .andWhere(function () {
          this.where("course_assigned.courseId_deleted", "<>", 1)
            .orWhereNull("course_assigned.courseId_deleted")
            .orWhere("course_assigned.courseId_deleted", "");
        })
        .where({ user_id: userId });

      for (const course of courses) {
        const modulesResult = await knex("modules")
          .where("course_id", course.id)
          .andWhere(function () {
            this.where("module_deleted", "<>", 1)
              .orWhereNull("module_deleted")
              .orWhere("module_deleted", "");
          })
          .andWhere(function () {
            this.whereRaw(`LOWER(name) like ?`, [`%${lowerCaseQuery}%`])
              .orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`])
              .orWhereRaw(`LOWER(version) like ?`, [`%${lowerCaseQuery}%`]);
          })
          .select(
            "name",
            "course_id",
            "thumbnail",
            knex.raw(`'modules' as table_name`)
          );

        modulesResult.forEach((module) => {
          finalResult.push({
            id: module.course_id,
            table_name: "modules",
            image_field: module.thumbnail,
            matched_query: module.name,
          });
        });

        // Video Modules search
        const videoModulesResult = await knex("video_modules")
          .where("course_id", course.id)
          .andWhere(function () {
            this.where("videoModule_deleted", "<>", 1)
              .orWhereNull("videoModule_deleted")
              .orWhere("videoModule_deleted", "");
          })
          .andWhere(function () {
            this.where("courseId_deleted", "<>", 1)
              .orWhereNull("courseId_deleted")
              .orWhere("courseId_deleted", "");
          })
          .andWhere(function () {
            this.whereRaw(`LOWER(module_name) like ?`, [
              `%${lowerCaseQuery}%`,
            ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
          })
          .select(
            "module_name",
            "course_id",
            "module_image",
            knex.raw(`'video_modules' as table_name`)
          );

        videoModulesResult.forEach((videoModule) => {
          finalResult.push({
            id: videoModule.course_id,
            table_name: "video_modules",
            image_field: videoModule.module_image,
            matched_query: videoModule.module_name,
          });
        });
      }
    }

    if (req.query.role === "manager") {
      const organisation = await knex("organisations")
        .select("organisations.id")
        .where("organisations.id", function () {
          this.select("organisation_id")
            .from("users")
            .where("users.id", userId)
            .andWhere("role", "manager")
            .andWhere(function () {
              this.where("user_deleted", "<>", 1)
                .orWhereNull("user_deleted")
                .orWhere("user_deleted", "");
            })
            .andWhere(function () {
              this.where("org_delete", "<>", 1)
                .orWhereNull("org_delete")
                .orWhere("org_delete", "");
            });
        })
        .andWhere(function () {
          this.where("organisation_deleted", "<>", 1)
            .orWhereNull("organisation_deleted")
            .orWhere("organisation_deleted", "");
        })
        .first();

      if (!organisation) {
        throw new Error("Organisation not found or deleted");
      }
      const usersResult = await knex("users")
        .where("organisation_id", organisation.id)
        .andWhere("role", "worker")
        .andWhere(function () {
          this.where("user_deleted", "<>", 1)
            .orWhereNull("user_deleted")
            .orWhere("user_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(fname) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(lname) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(username) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "fname",
          "lname",
          "user_thumbnail",
          "uemail",
          knex.raw(`'users' as table_name`)
        );

      usersResult.forEach((user) => {
        finalResult.push({
          matched_query: `${user.fname} ${user.lname}`,
          email: user.uemail,
          image_field: user.user_thumbnail,
          table_name: "users",
        });
      });

      // manger courses
      const coursesResult = await knex("courses1")
        .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
        .where({ organisation_id: organisation.id })
        .andWhere(function () {
          this.where("course_deleted", "<>", 1)
            .orWhereNull("course_deleted")
            .orWhere("course_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(name) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(category) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(level) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "courses1.id",
          "course_contents.name",
          "course_contents.category",
          "course_contents.course_thumbnail",
          knex.raw(`'courses1' as table_name`)
        );

      coursesResult.forEach((course) => {
        finalResult.push({
          matched_query: course.name,
          table_name: "courses1",
          image_field: course.course_thumbnail,
          category: course.category,
        });
      });

      const courses = await knex("courses1")
        .where({ organisation_id: organisation.id })
        .andWhere(function () {
          this.where("course_deleted", "<>", 1)
            .orWhereNull("course_deleted")
            .orWhere("course_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        });
      for (const course of courses) {
        const modulesResult = await knex("modules")
          .where({ course_id: course.id })
          .andWhere(function () {
            this.where("module_deleted", "<>", 1)
              .orWhereNull("module_deleted")
              .orWhere("module_deleted", "");
          })
          .andWhere(function () {
            this.where("courseId_deleted", "<>", 1)
              .orWhereNull("courseId_deleted")
              .orWhere("courseId_deleted", "");
          })
          .andWhere(function () {
            this.whereRaw(`LOWER(name) like ?`, [
              `%${lowerCaseQuery}%`,
            ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
          })
          .select(
            "course_id",
            "name",
            "thumbnail",
            knex.raw(`'modules' as table_name`)
          );

        // Append the modules to the final result array
        modulesResult.forEach((module) => {
          finalResult.push({
            id: module.course_id,
            matched_query: module.name,
            image_field: module.thumbnail,
            table_name: "modules",
          });
        });

        const videoModulesResult = await knex("video_modules")
          .where({ course_id: course.id })
          .andWhere(function () {
            this.where("videoModule_deleted", "<>", 1)
              .orWhereNull("videoModule_deleted")
              .orWhere("videoModule_deleted", "");
          })
          .andWhere(function () {
            this.where("courseId_deleted", "<>", 1)
              .orWhereNull("courseId_deleted")
              .orWhere("courseId_deleted", "");
          })
          .andWhere(function () {
            this.whereRaw(`LOWER(module_name) like ?`, [
              `%${lowerCaseQuery}%`,
            ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
          })
          .select(
            "course_id",
            "module_name",
            "module_image",
            knex.raw(`'video_modules' as table_name`)
          );

        videoModulesResult.forEach((videoModule) => {
          finalResult.push({
            id: videoModule.course_id,
            matched_query: videoModule.module_name,
            image_field: videoModule.module_image,
            table_name: "video_modules",
          });
        });
      }
    }

    if (req.query.role === "admin") {
      const organisation = await knex("organisations")
        .select("id")
        .where("id", function () {
          this.select("organisation_id")
            .from("users")
            .where("id", userId)
            .andWhere("role", "admin")
            .andWhere(function () {
              this.where("user_deleted", "<>", 1)
                .orWhereNull("user_deleted")
                .orWhere("user_deleted", "");
            })
            .andWhere(function () {
              this.where("org_delete", "<>", 1)
                .orWhereNull("org_delete")
                .orWhere("org_delete", "");
            });
        })
        .andWhere(function () {
          this.where("organisation_deleted", "<>", 1)
            .orWhereNull("organisation_deleted")
            .orWhere("organisation_deleted", "");
        })
        .first();

      if (!organisation) {
        throw new Error("Organisation not found or deleted");
      }
      // Admin Users
      const usersResult = await knex("users")
        .where("organisation_id", organisation.id)
        .andWhere(function () {
          this.where("role", "manager").orWhere("role", "worker");
        })
        .andWhere(function () {
          this.where("user_deleted", "<>", 1)
            .orWhereNull("user_deleted")
            .orWhere("user_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(fname) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(lname) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(username) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(uemail) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "fname",
          "lname",
          "user_thumbnail",
          "uemail",
          knex.raw(`'users' as table_name`)
        );

      usersResult.forEach((user) => {
        finalResult.push({
          matched_query: `${user.fname} ${user.lname}`,
          email: user.uemail,
          image_field: user.user_thumbnail,
          table_name: "users",
        });
      });

      // Admin Courses
      const coursesResult = await knex("courses1")
        .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
        .where({ organisation_id: organisation.id })
        .andWhere(function () {
          this.where("course_deleted", "<>", 1)
            .orWhereNull("course_deleted")
            .orWhere("course_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(name) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(category) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(level) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "courses1.id",
          "course_contents.name",
          "course_contents.category",
          "course_contents.course_thumbnail",
          knex.raw(`'courses1' as table_name`)
        );

      coursesResult.forEach((course) => {
        finalResult.push({
          matched_query: course.name,
          table_name: "courses1",
          image_field: course.course_thumbnail,
          category: course.category,
        });
      });

      const courses = await knex("courses1")
        .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
        .where({ organisation_id: organisation.id })
        .andWhere(function () {
          this.where("course_deleted", "<>", 1)
            .orWhereNull("course_deleted")
            .orWhere("course_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        });

      for (const course of courses) {
        const modulesResult = await knex("modules")
          .where({ course_id: course.id })
          .andWhere(function () {
            this.where("module_deleted", "<>", 1)
              .orWhereNull("module_deleted")
              .orWhere("module_deleted", "");
          })
          .andWhere(function () {
            this.where("courseId_deleted", "<>", 1)
              .orWhereNull("courseId_deleted")
              .orWhere("courseId_deleted", "");
          })
          .andWhere(function () {
            this.whereRaw(`LOWER(name) like ?`, [
              `%${lowerCaseQuery}%`,
            ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
          })
          .select("course_id", knex.raw(`'modules' as table_name`));

        modulesResult.forEach((module) => {
          finalResult.push({
            id: module.course_id,
            matched_query: module.name,
            image_field: module.thumbnail,
            table_name: "modules",
          });
        });

        const videoModulesResult = await knex("video_modules")
          .where({ course_id: course.id })
          .andWhere(function () {
            this.where("videoModule_deleted", "<>", 1)
              .orWhereNull("videoModule_deleted")
              .orWhere("videoModule_deleted", "");
          })
          .andWhere(function () {
            this.where("courseId_deleted", "<>", 1)
              .orWhereNull("courseId_deleted")
              .orWhere("courseId_deleted", "");
          })
          .andWhere(function () {
            this.whereRaw(`LOWER(module_name) like ?`, [
              `%${lowerCaseQuery}%`,
            ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
          })
          .select(
            "course_id",
            "module_name",
            "module_image",
            knex.raw(`'video_modules' as table_name`)
          );

        videoModulesResult.forEach((videoModule) => {
          finalResult.push({
            id: videoModule.course_id,
            matched_query: videoModule.module_name,
            image_field: videoModule.module_image,
            table_name: "video_modules",
          });
        });
      }

      const quizResult = await knex("quiz_tb")
        .whereRaw(`LOWER(quiz_name) like ?`, [`%${lowerCaseQuery}%`])
        .select(
          "quiz_name",
          "quiz_thumbnail",
          "status",
          knex.raw(`'quiz_tb' as table_name`)
        );

      quizResult.forEach((quiz) => {
        finalResult.push({
          matched_query: `${quiz.quiz_name}`,
          table_name: "quiz_tb",
          image_field: quiz.quiz_thumbnail,
          status: quiz.status,
        });
      });
    }

    if (req.query.role === "Superadmin") {
      const usersResult = await knex("users")
        .andWhere(function () {
          this.where("user_deleted", "<>", 1)
            .orWhereNull("user_deleted")
            .orWhere("user_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(fname) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(lname) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(username) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(uemail) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "user_thumbnail",
          "fname",
          "lname",
          "uemail",
          knex.raw(`'users' as table_name`)
        );

      const quizResult = await knex("quiz_tb")
        .whereRaw(`LOWER(quiz_name) like ?`, [`%${lowerCaseQuery}%`])
        .select(
          "quiz_name",
          "quiz_thumbnail",
          "status",
          knex.raw(`'quiz_tb' as table_name`)
        );

      quizResult.forEach((quiz) => {
        finalResult.push({
          matched_query: `${quiz.quiz_name}`,
          table_name: "quiz_tb",
          image_field: quiz.quiz_thumbnail,
          status: quiz.status,
        });
      });

      const coursesResult = await knex("courses1")
        .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
        .andWhere(function () {
          this.where("course_deleted", "<>", 1)
            .orWhereNull("course_deleted")
            .orWhere("course_deleted", "");
        })
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(name) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(category) like ?`, [`%${lowerCaseQuery}%`])
            .orWhereRaw(`LOWER(level) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "course_contents.course_thumbnail",
          "course_contents.name",
          "course_contents.category",
          knex.raw(`'courses1' as table_name`)
        );

      const devicesResult = await knex("devices_names")
        .whereRaw(`LOWER(device_name) like ?`, [`%${lowerCaseQuery}%`])
        .orWhereRaw(`LOWER(wifi_name) like ?`, [`%${lowerCaseQuery}%`])
        .andWhere(function () {
          this.where("org_delete", "<>", 1)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "");
        })
        .select(
          "device_model",
          "device_name",
          "serial_no",
          knex.raw(`'devices_names' as table_name`)
        );

      const modulesResult = await knex("modules")
        .andWhere(function () {
          this.where("module_deleted", "<>", 1)
            .orWhereNull("module_deleted")
            .orWhere("module_deleted", "");
        })
        .andWhere(function () {
          this.where("courseId_deleted", "<>", 1)
            .orWhereNull("courseId_deleted")
            .orWhere("courseId_deleted", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(name) like ?`, [
            `%${lowerCaseQuery}%`,
          ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "thumbnail",
          "name",
          "course_id",
          knex.raw(`'modules' as table_name`)
        );

      const organisationsResult = await knex("organisations")
        .andWhere(function () {
          this.where("organisation_deleted", "<>", 1)
            .orWhereNull("organisation_deleted")
            .orWhere("organisation_deleted", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(name) like ?`, [
            `%${lowerCaseQuery}%`,
          ]).orWhereRaw(`LOWER(org_email) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "organisation_icon",
          "name",
          "org_email",
          knex.raw(`'organisations' as table_name`)
        );

      const videoModulesResult = await knex("video_modules")
        .andWhere(function () {
          this.where("videoModule_deleted", "<>", 1)
            .orWhereNull("videoModule_deleted")
            .orWhere("videoModule_deleted", "");
        })
        .andWhere(function () {
          this.where("courseId_deleted", "<>", 1)
            .orWhereNull("courseId_deleted")
            .orWhere("courseId_deleted", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(module_name) like ?`, [
            `%${lowerCaseQuery}%`,
          ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select(
          "module_image",
          "module_name",
          "course_id",
          knex.raw(`'video_modules' as table_name`)
        );

      const tagsResult = await knex("tags")
        .whereRaw(`LOWER(name) like ?`, [`%${lowerCaseQuery}%`])
        .select("id", "name", knex.raw(`'tags' as table_name`));

      const vrContentResult = await knex("vr_content")
        .andWhere(function () {
          this.where("content_deleted", "<>", 1)
            .orWhereNull("content_deleted")
            .orWhere("content_deleted", "");
        })
        .andWhere(function () {
          this.whereRaw(`LOWER(title) like ?`, [
            `%${lowerCaseQuery}%`,
          ]).orWhereRaw(`LOWER(description) like ?`, [`%${lowerCaseQuery}%`]);
        })
        .select("thumbnail", "title", knex.raw(`'vr_content' as table_name`));

      // Combine results
      usersResult.forEach((user) => {
        finalResult.push({
          matched_query: `${user.fname} ${user.lname}`,
          table_name: "users",
          image_field: user.user_thumbnail,
          email: user.uemail,
        });
      });

      coursesResult.forEach((course) => {
        finalResult.push({
          matched_query: course.name,
          table_name: "courses1",
          image_field: course.course_thumbnail,
          category: course.category,
        });
      });

      devicesResult.forEach((device) => {
        finalResult.push({
          matched_query: device.device_name,
          table_name: "devices_names",
          image_field: device.device_model,
          model: device.serial_no,
        });
      });

      modulesResult.forEach((module) => {
        finalResult.push({
          matched_query: module.name,
          table_name: "modules",
          image_field: module.thumbnail,
          id: module.course_id,
        });
      });

      organisationsResult.forEach((organisation) => {
        finalResult.push({
          matched_query: organisation.name,
          table_name: "organisations",
          image_field: organisation.organisation_icon,
          email: organisation.org_email,
        });
      });

      videoModulesResult.forEach((videoModule) => {
        finalResult.push({
          matched_query: videoModule.module_name,
          table_name: "video_modules",
          image_field: videoModule.module_image,
          id: videoModule.course_id,
        });
      });

      tagsResult.forEach((tag) => {
        finalResult.push({
          matched_query: tag.name,
          table_name: "tags",
          tag_name: tag.name,
          id: tag.id,
        });
      });

      vrContentResult.forEach((content) => {
        finalResult.push({
          matched_query: content.title,
          table_name: "vr_content",
          image_field: content.thumbnail,
          title: content.title,
        });
      });
    }

    return res.status(200).json(finalResult);
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error fetching search data" });
  }
};

exports.getUserAssignedCourses = async (req, res) => {
  const userId = req.query.userId;

  try {
    const courses = await knex("course_assigned")
      .join("courses1", "course_assigned.course_id", "courses1.id")
      .leftJoin("course_contents", "courses1.id", "course_contents.course_id")
      .select(
        "courses1.id",
        "courses1.level",
        "courses1.organisation_id",
        "course_contents.lang_code",
        "course_contents.course_thumbnail",
        "course_contents.name",
        "course_contents.category",
        "course_contents.id as contentId"
      )
      .where({ user_id: userId })
      .andWhere(function () {
        this.where("courses1.course_deleted", "<>", 1)
          .orWhereNull("courses1.course_deleted")
          .orWhere("courses1.course_deleted", "");
      })
      .andWhere(function () {
        this.where("courses1.org_delete", "<>", 1)
          .orWhereNull("courses1.org_delete")
          .orWhere("courses1.org_delete", "");
      });
    const formattedCourses = [];

    courses.forEach((course) => {
      let existingCourse = formattedCourses.find((c) => c.id === course.id);

      if (!existingCourse) {
        existingCourse = {
          id: course.id,
          level: course.level,
          organisation_id: course.organisation_id,
          data: [],
        };
        formattedCourses.push(existingCourse);
      }

      existingCourse.data.push({
        id: course.contentId,
        name: course.name,
        language: course.lang_code,
        category: course.category,
        course_thumbnail: course.course_thumbnail,
      });
    });

    if (!formattedCourses.length) {
      return res.status(200).json({ message: "No courses found." });
    }

    return res.status(200).json(formattedCourses);
  } catch (error) {
    console.error("Error getting user courses: ", error);
    return res.status(500).json({ message: "Error getting user courses" });
  }
};

exports.demoEmail = async (req, res) => {
  const {
    fname,
    lname,
    email,
    preferredDate,
    preferredTime,
    message,
    phone,
    companyName,
    website,
  } = req.body;

  try {
    const [users, adminUsers] = await Promise.all([
      knex("users"),
      knex("users").where({ role: "admin" }),
    ]);

    if (!users) {
      return res.status(404).send({ message: "User not found" });
    }

    const userMailContent = `
      <p>Dear ${fname},</p>
      <p>Thank you for reaching out to us! We have received your inquiry and appreciate you taking the time to connect with us.</p>
      <p>Here's the information you submitted:</p>
      <ul>
          <li><strong>Name:</strong> ${fname} ${lname}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone No:</strong> ${phone}</li>
          <li><strong>Company Name:</strong> ${companyName}</li>
          <li><strong>Preferred Date:</strong> ${preferredDate}</li>
          <li><strong>Preferred Time:</strong> ${preferredTime}</li>
          <li><strong>Message:</strong> ${message}</li>
      </ul>
      <p>Our team is currently reviewing your message and will get back to you within 24-48 hours.</p>
      <p>Thank you again for your interest!</p>
      <p>InsightXR Team</p>`;

    sendMail(email, "Thank you for your inquiry!", userMailContent)
      .then(() => console.log("User email sent successfully"))
      .catch((emailError) =>
        console.log("Failed to send user email:", emailError)
      );

    const adminMailContent = `
      <p>New inquiry received:</p>
      <ul>
          <li><strong>Name:</strong> ${fname} ${lname}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone No:</strong> ${phone}</li>
          <li><strong>Company Name:</strong> ${companyName}</li>
          <li><strong>Preferred Date:</strong> ${preferredDate}</li>
          <li><strong>Preferred Time:</strong> ${preferredTime}</li>
          <li><strong>Message:</strong> ${message}</li>
      </ul>
      <p>Please take the necessary action.</p>
      <p>InsightXR Team</p>`;

    const adminEmailPromises = adminUsers.map((admin) =>
      sendMail(admin.uemail, "New Inquiry Notification", adminMailContent)
        .then(() => console.log(`Admin email sent to ${admin.uemail}`))
        .catch((emailError) =>
          console.log(
            `Failed to send email to admin ${admin.uemail}:`,
            emailError
          )
        )
    );

    await Promise.all(adminEmailPromises);

    return res.status(200).send({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Error processing request:", error);
    return res
      .status(500)
      .send({ message: "An error occurred while processing your request." });
  }
};

exports.dataAccordingTomonth = async (req, res) => {
  const { orgId, tab } = req.query;

  let year = moment().year();
  if (tab && tab === "1") {
    year = moment().year() - 1;
  }
  const startDate = moment().year(year).startOf("year").format("YYYY-MM-DD");
  const endDate = moment()
    .year(year)
    .endOf("year")
    .format("YYYY-MM-DD HH:mm:ss");

  const months = [];
  for (
    let m = moment(startDate);
    m.isBefore(endDate) || m.isSame(endDate, "month");
    m.add(1, "month")
  ) {
    months.push({
      month: m.format("YYYY-MM"),
      monthName: m.format("MMMM"),
    });
  }

  try {
    const addOrgIdCondition = (query) => {
      if (orgId != "0" && orgId !== "undefined") {
        query.where("organisation_id", orgId);
      }
      return query;
    };

    const coursesCount = await addOrgIdCondition(knex("courses1"))
      .select(
        knex.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
        knex.raw("COUNT(*) as count")
      )
      .whereBetween("created_at", [startDate, endDate])
      .andWhere(function () {
        this.where("course_deleted", "<>", 1)
          .orWhereNull("course_deleted")
          .orWhere("course_deleted", "");
      })
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      })
      .groupBy("month");

    const usersCount = await addOrgIdCondition(knex("users"))
      .select(
        knex.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
        knex.raw("COUNT(*) as count")
      )
      .whereBetween("created_at", [startDate, endDate])
      .whereNotNull("created_at")
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      })
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      })
      .groupBy("month");

    const devicesCount = await addOrgIdCondition(knex("devices_names"))
      .select(
        knex.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
        knex.raw("COUNT(*) as count")
      )
      .whereBetween("created_at", [startDate, endDate])
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      })
      .groupBy("month");

    const combineCounts = (countData) => {
      const countsMap = new Map(
        countData.map((item) => [item.month, item.count])
      );
      return months.map(({ month, monthName }) => ({
        month,
        monthName,
        count: countsMap.get(month) || 0,
      }));
    };

    const result = {
      courses: combineCounts(coursesCount),
      users: combineCounts(usersCount),
      devices: combineCounts(devicesCount),
    };

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getAllLanguage = async (req, res) => {
  try {
    const languages = await knex("language").select("*");

    res.status(200).json(languages);
  } catch (error) {
    console.error(error, "Error");
    res
      .status(500)
      .json({ message: "Error retrieving languages", error: error.message });
  }
};

exports.getAllOrganisations = async (req, res) => {
  try {
    const organisations = await knex("organisations").select("*");

    res.status(200).json(organisations);
  } catch (error) {
    console.error(error, "Error");
    res.status(500).json({
      message: "Error retrieving organisations",
      error: error.message,
    });
  }
};

exports.updateLanguageStatus = async (req, res) => {
  const { id, status } = req.body;
  try {
    await knex("language").where("id", id).update({ lang_status: status });

    res.status(200).send({ message: "Language updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      message: "Error updating language status",
      error: error.message,
    });
  }
};

exports.contactEmail = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      message,
      companyName,
      phoneNumber,
      companySector,
      companyWebsite,
    } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const emailData = {
      name: firstName + " " + lastName,
      email: email,
      companyName: companyName,
      companySector: companySector,
      companyWebsite: companyWebsite,
      phoneNumber: phoneNumber,
      message: message,
      date: new Date().getFullYear(),
    };

    const renderedEmail = compiledContact(emailData);

    try {
      await sendMail(
        process.env.ADMIN_EMAIL,
        `New Contact Request from ${firstName} ${lastName}`,
        renderedEmail
      );
    } catch (emailError) {
      console.log("Failed to send email:", emailError);
    }

    res.status(200).json({ success: true, message: "Email Sent Successfully" });
  } catch (error) {
    console.log("Failed to send email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send email" });
  }
};

exports.addLanguage = async (req, res) => {
  const { language, shortName, status, flag } = req.body;

  try {
    const existingLang = await knex("language")
      .where("lang_name", language)
      .orWhere("short_name", shortName)
      .first();

    if (existingLang) {
      return res.status(200).json({ message: "exists" });
    }
    const data = {
      lang_name: language,
      short_name: shortName,
      lang_status: status,
      flag,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    };

    await knex("language").insert(data);

    return res.status(201).json({ message: "Language added successfully" });
  } catch (error) {
    console.error("Error adding language:", error);
    return res.status(500).json({ message: "Failed to add language", error });
  }
};

exports.weakAreas = async (req, res) => {
  const org = req.params.org;
  const getLessonsByTags = async (tags) => {
    if (!Array.isArray(tags)) {
      tags = [];
    }

    return knex("lesson_video").whereIn("id", tags).select("*");
  };
  try {
    const incorrectQuestions = await knex("user_assessments")
      .whereNotNull("wrong_answers")
      .join("courses1", "courses1.id", "=", "user_assessments.course_id")
      .where("courses1.organisation_id", org)
      .andWhere(function () {
        this.where("courses1.course_deleted", "<>", 1)
          .orWhereNull("courses1.course_deleted")
          .orWhere("courses1.course_deleted", "");
      })
      .andWhere(function () {
        this.where("courses1.org_delete", "<>", 1)
          .orWhereNull("courses1.org_delete")
          .orWhere("courses1.org_delete", "");
      })
      .select("wrong_answers");

    let wrongAnswerIds = [];
    incorrectQuestions.forEach((record) => {
      wrongAnswerIds = [...wrongAnswerIds, ...JSON.parse(record.wrong_answers)];
    });

    const questionCounts = wrongAnswerIds.reduce((acc, questionId) => {
      acc[questionId] = (acc[questionId] || 0) + 1;
      return acc;
    }, {});

    const top5WrongAnswers = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const qArray = [];

    for (const [questionId, count] of top5WrongAnswers) {
      const question = await knex("quiz_questions")
        .where("id", questionId)
        .first();
      const course = await knex("course_contents")
        .where("course_id", question.course_id)
        .first();
      const quiz = await knex("quiz_tb").where("id", question.quiz_id).first();
      const tags = JSON.parse(question.tags || "[]");

      const lessons = await getLessonsByTags(tags);

      qArray.push({
        question_name: question.question,
        quiz_name: quiz.quiz_name,
        course_name: course.name,
        tags: lessons,
      });
    }

    res.json(qArray);
  } catch (error) {
    console.log("Error getting student weak areas: ", error);
    return res
      .status(500)
      .json({ message: "Failed to get student weak areas", error });
  }
};

exports.addSharedOrg = async (req, res) => {
  try {
    // 1. Parse and validate input data
    let patient_ids, organisation_ids;
    console.log("yes calleed");
    try {
      patient_ids = JSON.parse(req.body.patient_ids || "[]");
      organisation_ids = JSON.parse(req.body.organisation_ids || "[]");

      console.log(patient_ids, "patient_ids calleed");
      console.log(organisation_ids, "organisation_ids calleed");

      if (!Array.isArray(patient_ids) || !Array.isArray(organisation_ids)) {
        throw new Error("Invalid array format");
      }
    } catch (parseError) {
      return res.status(400).json({
        message: "Invalid data format",
        details: parseError.message,
      });
    }

    // 2. Validate non-empty arrays
    if (organisation_ids.length === 0 || patient_ids.length === 0) {
      return res.status(400).json({
        message: "Both patient_ids and organisation_ids must contain values",
      });
    }

    // 3. Verify all organizations exist
    const existingOrgs = await knex("organisations")
      .whereIn("id", organisation_ids)
      .pluck("id"); // Just get the IDs

    const missingOrgs = organisation_ids.filter(
      (id) => !existingOrgs.includes(Number(id))
    );

    if (missingOrgs.length > 0) {
      return res.status(404).json({
        message: "Some organizations not found",
        missing_ids: missingOrgs,
      });
    }

    // 4. Process updates in transaction
    const results = await knex.transaction(async (trx) => {
      const updateResults = [];
      console.log("Final patient_ids before loop:", patient_ids);

      for (const patientId of patient_ids) {
        console.log("Processing patientId:", patientId);

        const patient = await trx("patient_records")
          .where({ id: patientId })
          .first();

        console.log("Fetched patient:", patient);

        if (!patient) {
          updateResults.push({ patientId, status: "not_found" });
          continue;
        }

        // Parse existing orgs
        let existingOrgs = [];
        try {
          if (patient.additional_orgs) {
            existingOrgs = JSON.parse(patient.additional_orgs || "[]");
            if (!Array.isArray(existingOrgs)) existingOrgs = [];
          }
        } catch (e) {
          console.warn(
            `Failed to parse additional_orgs for patient ${patientId}`,
            e
          );
          existingOrgs = [];
        }

        // Combine & update
        const cleanExisting = existingOrgs
          .map((id) => String(id).trim())
          .filter(Boolean);
        const updatedOrgs = Array.from(
          new Set([...cleanExisting, ...organisation_ids.map(String)])
        );

        console.log(`Updating patient ${patientId} with orgs:`, updatedOrgs);

        await trx("patient_records")
          .where({ id: patientId })
          .update({ additional_orgs: JSON.stringify(updatedOrgs) });

        updateResults.push({
          patientId,
          status: "updated",
          count: updatedOrgs.length,
        });
      }

      return updateResults;
    });

    // 5. Return success response with detailed information
    res.status(200).json({
      message: "Sharing operation completed",
      results: results,
      stats: {
        totalPatients: patient_ids.length,
        updated: results.filter((r) => r.status === "updated").length,
        notFound: results.filter((r) => r.status === "not_found").length,
      },
    });
  } catch (error) {
    console.error("Error while sharing patients:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
