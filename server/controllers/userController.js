const bcrypt = require("bcrypt");
const { uploadFile, deleteObject } = require("../services/S3_Services");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const crypto = require("crypto");

const { defaultApp } = require("../firebase");
const sendMail = require("../helpers/mailHelper");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const welcomeEmail = fs.readFileSync("./EmailTemplates/Welcome.ejs", "utf8");
const VerificationEmail = fs.readFileSync(
  "./EmailTemplates/Verification.ejs",
  "utf8"
);
const ResetEmail = fs.readFileSync(
  "./EmailTemplates/ResetPassword.ejs",
  "utf8"
);
const PasswordEmail = fs.readFileSync(
  "./EmailTemplates/PasswordUpdate.ejs",
  "utf8"
);
const contactRequestEmail = fs.readFileSync(
  "./EmailTemplates/ContactRequest.ejs",
  "utf8"
);
const compiledFeedbackAdmin = fs.readFileSync(
  "./EmailTemplates/compiledFeedback.ejs",
  "utf8"
);
const Thanksfeedback = fs.readFileSync(
  "./EmailTemplates/Thanksfeedback.ejs",
  "utf8"
);

const i18nDir = path.join(__dirname, "../i18n");

const compiledContact = ejs.compile(contactRequestEmail);
const compiledWelcome = ejs.compile(welcomeEmail);
const compiledVerification = ejs.compile(VerificationEmail);
const compiledReset = ejs.compile(ResetEmail);
const compiledPassword = ejs.compile(PasswordEmail);
const compiledFeedback = ejs.compile(compiledFeedbackAdmin);
const compiledThanks = ejs.compile(Thanksfeedback);
// const translationFilePath = path.join(__dirname, "../i18n/en_uk.json");

require("dotenv").config();

function generateRandomString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

function generateToken(user) {
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  return token;
}

exports.createUser = async (req, res) => {
  const user = req.body;

  const superadminIds = user.superadminIds
    ? JSON.parse(user.superadminIds)
    : [];

  function generateUniqueId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  function getTableName(role) {
    switch (role) {
      case "Admin":
        return "Admin";
      case "Faculty":
        return "Faculty";
      case "Observer":
        return "Observer";
      case "User":
        return "User";
      case "Administrator":
        return "Administrator";
      default:
        return null;
    }
  }

  try {
    if (
      !user.firstName ||
      !user.lastName ||
      !user.username ||
      !user.email ||
      !user.role
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required user fields" });
    }

    const existingUsername = await knex("users")
      .where({ username: user.username })
      .first();
    if (existingUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username Exists" });
    }

    // Check if email already exists
    const existingEmail = await knex("users")
      .where({ uemail: user.email })
      .first();
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email Exists" });
    }

    const userUniqueId = generateUniqueId();
    const userRole = getTableName(user.role);
    if (!userRole) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user role" });
    }

    const newUser = {
      fname: user.firstName,
      lname: user.lastName,
      username: user.username,
      uemail: user.email,
      role: userRole,
      accessToken: null,
      verification_code: null,
      user_unique_id: userUniqueId,
      user_thumbnail: user.thumbnail,
      token: user.uid,
      organisation_id: user.organisationId || null,
      password: 0,
      created_at: new Date(),
    };

    const result = await knex("users").insert(newUser);
    const orgData = await knex("organisations")
      .where("id", user.organisationId)
      .first();
    const userId = result[0];

    try {
      const faculties = await knex("users")
        .where({
          organisation_id: user.organisationId,
          role: "Faculty",
          user_deleted: 0,
          org_delete: 0,
        })
        .select("id");

      const facultyIds = faculties.map((f) => f.id);

      const message = `New user '${user.firstName} ${user.lastName}' added to the platform.`;
      const title = "New User Added";
      const notify_by = Number(user.uid) || null;

      const notifications = facultyIds.map((facultyId) => ({
        notify_by,
        notify_to: facultyId,
        message,
        title,
        created_at: new Date(),
      }));

      if (superadminIds.length > 0) {
        const filteredSuperadminIds = superadminIds.filter(
          (adminId) => adminId !== notify_by
        );

        if (filteredSuperadminIds.length > 0) {
          const superadminNotifications = filteredSuperadminIds.map(
            (adminId) => ({
              notify_by,
              notify_to: adminId,
              message,
              title,
              created_at: new Date(),
            })
          );

          await knex("notifications").insert(superadminNotifications);
        }
      }

      if (notifications.length > 0) {
        await knex("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("Failed to send notifications to faculties:", notifError);
    }

    const org = await knex("organisations")
      .select("*")
      .where("id", user.organisationId)
      .first();

    const passwordSetToken = jwt.sign({ userId }, process.env.JWT_SECRET);
    const url = `${process.env.CLIENT_URL}/reset-password?token=${passwordSetToken}&type=set`;

    const settings = await knex("settings").first();

    const emailData = {
      role: userRole,
      name: user.firstName,
      org: org?.name || "Unknown Organisation",
      url,
      username: user.email,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
      planType: orgData?.planType,
    };

    if (orgData?.planType === "free") {
      const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      };

      const now = new Date();
      const after30Days = new Date();
      after30Days.setDate(now.getDate() + 30);

      emailData.currentDate = formatDate(now);
      emailData.expiryDate = formatDate(after30Days);
    }

    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(user.email, "Welcome to InpatientSIM!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    return res
      .status(200)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ success: false, message: "User Added Error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.user_deleted == 1) {
      return res.status(400).send({ message: "User account has been deleted" });
    }

    if (user.org_delete == 1) {
      return res.status(400).send({ message: "Organisation has been deleted" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const token = generateToken(user);
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined;

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: maxAge,
      path: "/",
    });

    res.status(200).send({
      message: "Login successful",
      email: rememberMe ? email : null,
    });
  } catch (error) {
    console.log("Error verifying login:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const users = await knex("users")
      .select("*")
      .whereNot("role", "Superadmin")
      .whereNot("role", "student")
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
      .orderBy("id", "desc");

    res.status(200).json(users);
  } catch (error) {
    console.log("Error getting users", error);
    res.status(500).send({ message: "Error getting users" });
  }
};

exports.countUsers = async (req, res) => {
  try {
    const roleCounts = await knex("users")
      .select("role")
      .count("* as count")
      .whereNot("role", "Superadmin")
      .whereNot("role", "student")
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
      .groupBy("role");

    const totalCount = await knex("users")
      .count("* as total")
      .whereNot("role", "Superadmin")
      .whereNot("role", "student")
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

    const response = {
      totalUsers: totalCount.total,
      Superadmin: 0,
      admin: 0,
      worker: 0,
      manager: 0,
    };

    roleCounts.forEach((row) => {
      if (row.role === "Superadmin") response.Superadmin = row.count;
      if (row.role === "admin") response.admin = row.count;
      if (row.role === "worker") response.worker = row.count;
      if (row.role === "manager") response.manager = row.count;
    });

    res.json(response);
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAdminAllCount = async (req, res) => {
  const id = req.params.id;
  const email = req.body.email;

  try {
    const userCount = await knex("users")
      .whereNot("role", "Superadmin")
      .whereNot({ uemail: email })
      .where({ organisation_id: id })
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
      .count("id as count");

    const organisationDetail = await knex("organisations")
      .where({ id: id })
      .andWhere(function () {
        this.where("organisation_deleted", "<>", 1)
          .orWhereNull("organisation_deleted")
          .orWhere("organisation_deleted", "");
      })
      .select("organisations.*");

    const patientCount = await knex("patient_records")
      .where(function () {
        this.where("organisation_id", id).orWhereRaw(
          `JSON_CONTAINS(additional_orgs, '["${id}"]')`
        );
      })
      .andWhere(function () {
        this.where("deleted_at", "<>", "deleted")
          .orWhereNull("deleted_at")
          .orWhere("deleted_at", "");
      })
      .count("id as count");

    const result = [
      { name: "users", count: parseInt(userCount[0].count, 10) || 0 },
      { name: "patients", count: parseInt(patientCount[0].count, 10) || 0 },
      organisationDetail,
    ];

    res.status(200).json(result);
  } catch (error) {
    console.error("Error while getting counts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await knex("users")
      .leftJoin("organisations", "organisations.id", "users.organisation_id")
      .leftJoin("payment as p", function () {
        this.on("p.orgId", "organisations.id").andOn(
          "p.created_at",
          "=",
          knex.raw(
            "(select max(created_at) from payment where payment.orgId = organisations.id)"
          )
        );
      })
      .select(
        "users.*",
        "organisations.name",
        "organisations.planType",
        "p.amount",
        "p.currency",
        "p.created_at"
      )
      .where("users.id", req.params.id)
      .orWhere("uemail", req.params.id)
      .first();

    res.status(200).send(user);
  } catch (error) {
    console.log("Error getting user", error);
    res.status(500).send({ message: "Error getting user" });
  }
};

exports.getCode = async (req, res) => {
  const id = req.params.id;

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  try {
    await knex("users")
      .where({ uemail: id })
      .update({
        verification_code: verificationCode,
        updated_at: knex.raw("CURRENT_TIMESTAMP"),
      });

    const user = await knex("users").where({ uemail: id }).first();

    const settings = await knex("settings").first();

    const emailData = {
      name: user.fname,
      code: verificationCode,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    const renderedEmail = compiledVerification(emailData);

    try {
      await sendMail(user.uemail, `Verify Your Device`, renderedEmail);
    } catch (emailError) {
      console.log("Failed to send email:", emailError);
    }

    res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("Error updating verification code:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.verifyUser = async (req, res) => {
  const { email, code, fcm_token } = req.body;

  try {
    const user = await knex("users").where({ uemail: email }).first();

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (user.verification_code.toString() !== code) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid verification code" });
    }

    const now = new Date();
    const codeGeneratedAt = new Date(user.updated_at);
    const expirationTime = new Date(codeGeneratedAt.getTime() + 15 * 60 * 1000);

    if (now > expirationTime) {
      return res
        .status(401)
        .json({ success: false, message: "Verification code has expired" });
    }

    await knex("users").where({ uemail: email }).update({
      fcm_token: fcm_token,
      lastLogin: new Date(),
      verification_code: null,
    });

    const existingLogin = await knex("lastLogin")
      .where({ userId: user.id })
      .first();

    if (existingLogin) {
      await knex("lastLogin").where({ userId: user.id }).update({
        login_time: new Date(),
        updated_at: new Date(),
      });
    } else {
      await knex("lastLogin").insert({
        userId: user.id,
        login_time: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const data = {
      role: user.role,
      id: user.id,
      org: user.organisation_id,
      plan: user.planType,
      date: new Date(),
    };

    res.status(200).json({
      success: true,
      data,
      message: "Verification successful",
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const users = await knex("users")
      .leftJoin("lastLogin", "lastLogin.userId", "=", "users.id")
      .select("users.*", "lastLogin.login_time as lastLoginTime")
      .whereNot("role", "Superadmin")
      .whereNot("role", "student")
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
      .orderBy("users.id", "desc");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllDetailsCount = async (req, res) => {
  try {
    const userCount = await knex("users")
      .whereNot("role", "Superadmin")
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
      .count("id as count");

    const organisationCount = await knex("organisations")
      .andWhere(function () {
        this.where("organisation_deleted", "<>", "deleted")
          .orWhereNull("organisation_deleted")
          .orWhere("organisation_deleted", "");
      })
      .count("id as count");

    const patientCount = await knex("patient_records")
      .andWhere(function () {
        this.where("deleted_at", "<>", "deleted")
          .orWhereNull("deleted_at")
          .orWhere("deleted_at", "");
      })
      .count("id as count");

    const result = [
      { name: "users", count: parseInt(userCount[0].count, 10) || 0 },
      {
        name: "organisations",
        count: parseInt(organisationCount[0].count, 10) || 0,
      },
      { name: "patients", count: parseInt(patientCount[0].count, 10) || 0 },
    ];

    res.status(200).json(result);
  } catch (error) {
    console.error("Error while getting counts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getSubscriptionDetails = async (req, res) => {
  try {
    const details = await knex("payment")
      .leftJoin("organisations", "organisations.id", "=", "payment.orgId")
      .leftJoin("users", "users.organisation_id", "=", "payment.orgId")
      .where("users.role", "=", "Admin")
      .andWhere(function () {
        this.where("organisations.organisation_deleted", "<>", 1).orWhereNull(
          "organisations.organisation_deleted"
        );
      })
      .select(
        "payment.orgId",
        knex.raw("MAX(payment.created_at) as created_at"),
        knex.raw("MAX(payment.purchaseOrder) as purchaseOrder"),
        "organisations.name as orgName",
        "organisations.planType",
        "users.username"
      )
      .groupBy(
        "payment.orgId",
        "organisations.name",
        "organisations.planType",
        "users.username"
      )
      .orderBy("created_at", "desc");

    res.status(200).json(details);
  } catch (error) {
    console.error("Error while getting counts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res
        .status(400)
        .json({ exists: false, message: "No username found" });
    }

    const user = await knex("users")
      .leftJoin(
        "organisations",
        "organisations.id",
        "=",
        "users.organisation_id"
      )
      .where({ username })
      .select(
        "users.id as user_id",
        "users.username as username",
        "users.fname as fname",
        "users.lname as lname",
        "users.uemail",
        "users.created_at as user_created_at",
        "users.updated_at as user_updated_at",
        "organisations.*"
      )
      .first();

    if (!user) {
      return res.status(200).json({ exists: false, message: "User not found" });
    }

    return res.status(200).json({ exists: true, message: "User found", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ exists: false, message: "No username found" });
    }

    const user = await knex("users")
      .leftJoin(
        "organisations",
        "organisations.id",
        "=",
        "users.organisation_id"
      )
      .where({ uemail: email })
      .first();

    if (!user) {
      return res.status(200).json({ exists: false, message: "User not found" });
    }

    return res.status(200).json({ exists: true, message: "User found", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { ids, deleted_by: deletedByEmail, name } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res
        .status(400)
        .json({ error: "Invalid request: IDs must be provided as an array." });
    }

    const idsToDelete = Array.isArray(ids) ? ids : [ids];

    const users = await knex("users")
      .whereIn("id", idsToDelete)
      .select("id", "fname", "lname", "organisation_id");

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found with the provided IDs." });
    }

    await knex("users")
      .whereIn("id", idsToDelete)
      .update({ user_deleted: "1" });

    const deletedByUser = await knex("users")
      .where({ uemail: deletedByEmail })
      .select("id", "role", "organisation_id")
      .first();

    if (!deletedByUser) {
      return res.status(400).json({ message: "Invalid deleted_by email." });
    }

    const deletedById = deletedByUser.id;
    const deletedByRole = deletedByUser.role;
    const deletedByOrgId = deletedByUser.organisation_id;

    const message =
      name && idsToDelete.length === 1
        ? `User ${name} deleted to the platform.`
        : `${idsToDelete.length} users have been deleted.`;

    const createdAt = new Date();
    const notifications = [];

    const orgIds = [...new Set(users.map((u) => u.organisation_id))];

    const faculty = await knex("users")
      .where({ role: "Faculty", organisation_id: deletedByOrgId })
      .andWhereNot("id", deletedById)
      .select("id");

    faculty.forEach((user) => {
      notifications.push({
        notify_by: deletedById,
        notify_to: user.id,
        title: "User Deletion",
        message,
        status: "unseen",
        created_at: createdAt,
        updated_at: createdAt,
      });
    });

    const superadmins = await knex("users")
      .where({ role: "Superadmin" })
      .andWhereNot("id", deletedById)
      .select("id");

    superadmins.forEach((admin) => {
      notifications.push({
        notify_by: deletedById,
        notify_to: admin.id,
        title: "User Deletion",
        message,
        status: "unseen",
        created_at: createdAt,
        updated_at: createdAt,
      });
    });

    // --- Administrator notifications ---
    const administrators = await knex("users")
      .where("role", "Administrator")
      .where(function () {
        this.where("user_deleted", 0)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      })
      .where(function () {
        this.where("org_delete", 0)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "")
          .orWhere("org_delete", "0");
      })
      .select("id");

    administrators.forEach((admin) => {
      notifications.push({
        notify_by: deletedById,
        notify_to: admin.id,
        title: "User Deletion",
        message,
        status: "unseen",
        created_at: createdAt,
        updated_at: createdAt,
      });
    });

    if (deletedByRole === "Superadmin") {
      const admins = await knex("users")
        .whereIn("organisation_id", orgIds)
        .andWhere({ role: "Admin" })
        .andWhereNot("id", deletedById)
        .select("id");

      const faculty = await knex("users")
        .whereIn("organisation_id", orgIds)
        .andWhere({ role: "Faculty" })
        .andWhereNot("id", deletedById)
        .select("id");

      const superadmins = await knex("users")
        .where({ role: "Superadmin" })
        .andWhereNot("id", deletedById)
        .select("id");

      [...admins, ...faculty, ...superadmins].forEach((user) => {
        notifications.push({
          notify_by: deletedById,
          notify_to: user.id,
          title: "User Deletion",
          message,
          status: "unseen",
          created_at: createdAt,
          updated_at: createdAt,
        });
      });
    }

    if (notifications.length > 0) {
      await knex("notifications").insert(notifications);
    }

    return res
      .status(200)
      .json({ message: "Users deleted and notifications sent successfully." });
  } catch (error) {
    console.error("Error deleting users:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting users." });
  }
};

exports.updateUser = async (req, res) => {
  const user = req.body;
  const superadminIds = user.superadminIds
    ? JSON.parse(user.superadminIds)
    : [];

  function getTableName(role) {
    switch (role) {
      case "Admin":
        return "Admin";
      case "Superadmin":
        return "Superadmin";
      case "Faculty":
        return "Faculty";
      case "Observer":
        return "Observer";
      case "User":
        return "User";
      case "Administrator":
        return "Administrator";
      default:
        return null;
    }
  }

  try {
    if (
      !user.id ||
      !user.firstName ||
      !user.lastName ||
      !user.username ||
      !user.email ||
      !user.role
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required user fields" });
    }

    const existingUsername = await knex("users")
      .where({ username: user.username })
      .whereNot({ id: user.id })
      .first();

    if (existingUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username Exists" });
    }

    const existingEmail = await knex("users")
      .where({ uemail: user.email })
      .whereNot({ id: user.id })
      .first();
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email Exists" });
    }

    const userRole = getTableName(user.role);
    if (!userRole) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user role" });
    }

    // --- Start of added logic ---
    const prevData = await knex("users").where("id", user.id).first();
    if (!prevData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const roleChanged = prevData.role !== userRole;

    const User = {
      fname: user.firstName,
      lname: user.lastName,
      username: user.username,
      uemail: user.email,
      organisation_id: user.organisationId,
      role: userRole,
      updated_at: new Date(),
    };

    if (user.thumbnail) {
      User.user_thumbnail = user.thumbnail;
    }

    await knex("users").update(User).where("id", user.id);

    // --- Start of added logic ---
    if (roleChanged) {
      const { getIO } = require("../websocket");
      const io = getIO();
      io.to(prevData.uemail).emit("userRoleChanged", {
        message: "Your role has been updated. Please log in again.",
        newRole: userRole,
      });
      console.log(
        `[Backend] Emitted 'userRoleChanged' to user ${prevData.uemail}`
      );
    }

    // Notifications (your existing logic)
    try {
      const organisationId = user.organisationId || prevData.organisation_id;

      const faculties = await knex("users")
        .where({
          organisation_id: organisationId,
          role: "Faculty",
          user_deleted: 0,
          org_delete: 0,
        })
        .select("id");

      const facultyIds = faculties.map((f) => f.id);

      const message = `User '${user.firstName} ${user.lastName}' was updated.`;
      const title = "User Updated";
      const notify_by = Number(user.uid) || null;

      const filteredFacultyIds = facultyIds.filter((id) => id !== notify_by);
      const notifications = filteredFacultyIds.map((facultyId) => ({
        // const notifications = facultyIds.map((facultyId) => ({
        notify_by,
        notify_to: facultyId,
        message,
        title,
        created_at: new Date(),
      }));

      // Filter superadmins (exclude the editor)
      if (superadminIds.length > 0) {
        const filteredSuperadminIds = superadminIds.filter(
          (adminId) => adminId !== notify_by
        );

        if (filteredSuperadminIds.length > 0) {
          const superadminNotifications = filteredSuperadminIds.map(
            (adminId) => ({
              notify_by,
              notify_to: adminId,
              message,
              title,
              created_at: new Date(),
            })
          );
          await knex("notifications").insert(superadminNotifications);
        }
      }

      // ✅ Administrators
      const administrators = await knex("users")
        .where("role", "Administrator")
        .where(function () {
          this.where("user_deleted", 0)
            .orWhereNull("user_deleted")
            .orWhere("user_deleted", "");
        })
        .where(function () {
          this.where("org_delete", 0)
            .orWhereNull("org_delete")
            .orWhere("org_delete", "")
            .orWhere("org_delete", "0");
        })
        .select("id");

      const adminIds = administrators.map((a) => a.id);
      if (adminIds.length > 0) {
        const administratorNotifications = adminIds.map((adminId) => ({
          notify_by,
          notify_to: adminId,
          message,
          title,
          created_at: new Date(),
        }));
        await knex("notifications").insert(administratorNotifications);
      }

      if (notifications.length > 0) {
        await knex("notifications").insert(notifications);
      }
    } catch (notifError) {
      console.error("Failed to send notifications:", notifError);
    }

    return res
      .status(200)
      .json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.log("Error: ", error);
    return res
      .status(500)
      .json({ success: false, message: "User Added Error" });
  }
};

exports.passwordLink = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await knex("users").where({ uemail: email }).first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordResetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const url = `${process.env.CLIENT_URL}/reset-password?&token=${passwordResetToken}&type=reset`;

    const settings = await knex("settings").first();

    const emailData = {
      name: user.fname,
      url: url,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    const renderedEmail = compiledReset(emailData);
    try {
      await sendMail(user.uemail, "Password Reset Request", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return res.status(500).json({ message: "Failed to send email" });
    }

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    console.error("Error sending password reset link:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password, type } = req.body;
  try {
    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "New password is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const userRecord = await knex("users").where({ id: userId }).first();

    if (!userRecord) {
      return res.status(404).json({ message: "User not found" });
    }

    if (type == "set" && userRecord.password != 0) {
      return res
        .status(400)
        .json({ message: "You have already updated your password." });
    }

    let firebaseUid;

    if (userRecord.password != 0) {
      try {
        const firebaseUser = await defaultApp
          .auth()
          .updateUser(userRecord.token, {
            password: password,
          });
        firebaseUid = firebaseUser.uid;
      } catch (firebaseError) {
        console.error("Error updating Firebase user:", firebaseError);
        return res
          .status(500)
          .json({ message: "Failed to update user on Firebase" });
      }
    } else {
      try {
        const firebaseUser = await defaultApp.auth().createUser({
          email: userRecord.uemail,
          password: password,
        });
        firebaseUid = firebaseUser.uid;
      } catch (firebaseError) {
        console.error("Error creating Firebase user:", firebaseError);
        return res
          .status(500)
          .json({ message: "Failed to create user in Firebase" });
      }
    }

    await knex("users")
      .where({ id: userId })
      .update({
        password: await bcrypt.hash(password, 10),
        token: firebaseUid,
      });

    const settings = await knex("settings").first();

    const emailData = {
      name: userRecord.fname,
      // url: url,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    const renderedEmail = compiledPassword(emailData);
    try {
      await sendMail(
        userRecord.uemail,
        "Password Successfully Updated",
        renderedEmail
      );
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return res.status(500).json({ message: "Failed to send email" });
    }

    res.status(200).json({ message: "Password successfully updated" });
  } catch (error) {
    console.error("Error resetting password:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message: "Token has expired. Please request a new password reset link.",
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUserByOrg = async (req, res) => {
  try {
    const { org } = req.params;

    if (!org) {
      return res
        .status(400)
        .json({ exists: false, message: "No organisation id  found" });
    }

    const users = await knex("users")
      .where({ organisation_id: org })
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

    if (!users) {
      return res.status(200).json({ exists: false, message: "User not found" });
    }

    return res.status(200).send(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const {
      metatitle,
      metadescription,
      metakeywords,
      favicon,
      whitelogo,
      colorlogo,
    } = req.body;

    const fileToUpdate = {
      meta_title: metatitle,
      description: metadescription,
      keywords: metakeywords,
      favicon: favicon,
      site_logo: whitelogo,
      site_colored_logo: colorlogo,
    };

    const prevSettings = await knex("settings").first();

    if (favicon) {
      if (prevSettings) {
        const key = prevSettings.favicon.split("/").pop();
        const deleteResult = await deleteObject(key);
      }
    }

    if (whitelogo) {
      if (prevSettings) {
        const key = prevSettings.site_logo.split("/").pop();
        const deleteResult = await deleteObject(key);
      }
    }

    if (colorlogo) {
      if (prevSettings) {
        const key = prevSettings.site_colored_logo.split("/").pop();
        const deleteResult = await deleteObject(key);
      }
    }

    await knex("settings").update(fileToUpdate);

    return res
      .status(200)
      .json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error while updating settings:", error);
    res.status(500).json({ message: "Error while updating settings" });
  }
};

exports.getSetting = async (req, res) => {
  try {
    const settings = await knex("settings").first();

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error while getting setting :", error);
    res.status(500).json({ message: "Error while getting settings" });
  }
};

exports.savePreferenceChanges = async (req, res) => {
  try {
    const { lighting_mode, play_mode, damage_control, item_control } = req.body;
    if (!lighting_mode || !play_mode || !damage_control || !item_control) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Data to submit
    const formToSubmit = {
      lighting_mode: lighting_mode,
      play_mode: play_mode,
      damage_control: damage_control,
      item_control: item_control,
    };

    const existingPreferences = await knex("prefrences").first();

    if (existingPreferences) {
      await knex("prefrences")
        .update(formToSubmit)
        .where({ id: existingPreferences.id });
      res
        .status(200)
        .json({ message: "Preference changes updated successfully!" });
    } else {
      await knex("prefrences").insert(formToSubmit);
      res
        .status(200)
        .json({ message: "Preference changes saved successfully!" });
    }
  } catch (error) {
    console.error("Error while saving changes:", error);
    res.status(500).json({ message: "Error while saving changes" });
  }
};

exports.getPreference = async (req, res) => {
  try {
    const data = await knex("prefrences").select("*");
    res.status(200).send(data);
  } catch (error) {
    console.error("Error while getting preference: ", error);
    res.status(400).json({ message: "Error while getting preference" });
  }
};

exports.AddOnlineUser = async (req, res) => {
  try {
    const { ipAddress, latitude, longitude, city, userid } = req.body;

    if (!userid) {
      return res.status(400).send({ message: "User ID is required" });
    }

    const user = await knex("users")
      .select("role")
      .where({ id: userid })
      .first();

    if (!user || (user.role !== "manager" && user.role !== "worker")) {
      return res.status(200).send({ message: "User not authorized" });
    }

    const dataToInsertOrUpdate = {
      ipaddress: ipAddress,
      latitude: latitude,
      longitude: longitude,
      country_code: city,
    };

    const existingUser = await knex("login_address").where({ userid }).first();

    if (existingUser) {
      await knex("login_address")
        .where({ userid })
        .update(dataToInsertOrUpdate);
      return res.status(200).send({ message: "User updated successfully" });
    }

    await knex("login_address").insert({ ...dataToInsertOrUpdate, userid });
    return res.status(200).send({ message: "Online User Added" });
  } catch (error) {
    console.error("Error adding or updating online user:", error);
    return res
      .status(500)
      .send({ message: "Error adding or updating online user" });
  }
};

exports.updateUserIdDelete = async (req, res) => {
  try {
    const { username } = req.query;
    const user = await knex("users")
      .select("id")
      .where({ uemail: username })
      .first();

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const userId = user.id;
    const deletedRows = await knex("online_users")
      .where({ userid: userId })
      .del();

    if (deletedRows) {
      res
        .status(200)
        .send({ message: "User successfully removed from online users" });
    } else {
      res.status(404).send({ message: "User not found in online users" });
    }
  } catch (error) {
    console.error("Error removing user from online users:", error);
    res.status(500).send({ message: "Error removing user from online users" });
  }
};

exports.getOnlineUsers = async (req, res) => {
  try {
    const data = await knex("online_users")
      .select("online_users.*", "users.user_thumbnail", "users.username")
      .leftJoin("users", "online_users.userid", "users.id")
      .orderBy("id", "desc");

    res.status(200).send(data);
  } catch (error) {
    console.error("Error while getting online users: ", error);
    res.status(400).json({ message: "Error while getting online users" });
  }
};

exports.orgOnlineUsers = async (req, res) => {
  const { orgId } = req.params;
  try {
    const data = await knex("online_users")
      .leftJoin("users", "online_users.userid", "users.id")
      .where("users.organisation_id", orgId)
      .andWhere("users.role", "worker")
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
      .select("online_users.*", "users.user_thumbnail", "users.username");

    res.status(200).send(data);
  } catch (error) {
    console.error("Error while getting online users: ", error);
    res.status(400).json({ message: "Error while getting online users" });
  }
};

//instructor
exports.getUserOrgId = async (req, res) => {
  try {
    const { username } = req.query;
    const user = await knex("users")
      .leftJoin(
        "organisations",
        "organisations.id",
        "=",
        "users.organisation_id"
      )
      .where(function () {
        this.where("users.uemail", username).orWhere(
          "users.username",
          username
        );
      })
      .select(
        "users.*",
        "organisations.planType",
        "organisations.created_at as planDate"
      )

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

    if (!user) {
      return res.status(404).json({ message: "Account deactivated" });
    }

    res.status(200).send(user);
  } catch (error) {
    console.log("Error getting user", error);
    res.status(500).send({ message: "Error getting user" });
  }
};

exports.leaderboard = async (req, res) => {
  try {
    const { organisation_id } = req.query;

    const usersWithAttempts = await knex("user_assessments")
      .distinct("user_id")
      .where("attempts", "1")
      .pluck("user_id");

    const eligibleUsers = await knex("users")
      .distinct("users.id")
      .innerJoin("course_assigned", "users.id", "course_assigned.user_id")
      .where({
        "course_assigned.organisation_id": organisation_id,
        "users.org_delete": null,
        "users.user_deleted": null,
        "course_assigned.courseId_deleted": null,
        "course_assigned.userid_deleted": null,
      })
      .whereIn("users.id", usersWithAttempts)
      .pluck("users.id");

    const leaderboard = await knex("users")
      .select(
        "users.id as user_id",
        "users.fname",
        "users.lname",
        "users.username",
        "users.user_thumbnail"
      )
      .innerJoin("course_assigned", "users.id", "course_assigned.user_id")
      .innerJoin("courses1", "course_assigned.course_id", "courses1.id")
      .innerJoin("quiz_tb", "courses1.id", "quiz_tb.course_id")
      .innerJoin("user_assessments", function () {
        this.on("users.id", "=", "user_assessments.user_id")
          .andOn("quiz_tb.id", "=", "user_assessments.quiz_id")
          .andOn("user_assessments.attempts", "=", knex.raw("?", ["1"]));
      })
      .where({
        "course_assigned.organisation_id": organisation_id,
        "courses1.org_delete": null,
        "courses1.course_deleted": null,
        "course_assigned.courseId_deleted": null,
        "course_assigned.userid_deleted": null,
        "users.org_delete": null,
        "users.user_deleted": null,
      })
      .whereIn("users.id", eligibleUsers)
      .groupBy(
        "users.id",
        "users.fname",
        "users.lname",
        "users.username",
        "users.user_thumbnail"
      )
      .select(
        knex.raw(`
          COALESCE(
            SUM(JSON_LENGTH(user_assessments.correct_answers)),
            0
          ) as score,
          CASE 
            WHEN RANK() OVER (ORDER BY COALESCE(SUM(JSON_LENGTH(user_assessments.correct_answers)), 0) DESC) = 1 
            THEN true 
            ELSE false 
          END as hasBadge
        `)
      )
      .having("score", ">", 0)
      .orderBy("score", "desc")
      .orderBy("users.fname", "asc");

    return res.status(200).json({
      message: "Leaderboard fetched successfully",
      data: leaderboard,
    });
  } catch (error) {
    console.error("[Leaderboard] Error:", error);
    return res.status(500).json({
      message: "Error getting leaderboard data",
      error: error.message,
    });
  }
};

exports.deleteVrSessionById = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    await knex.transaction(async (trx) => {
      await trx("multi_vr_sessions").where("session_id", sessionId).del();

      await trx("vr_sessions").where("id", sessionId).del();
    });

    return res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting Session:", error);
    return res.status(500).json({ error: "Failed to delete Session" });
  }
};

exports.notifyStudentAtRisk = async (req, res) => {
  try {
    let users;
    try {
      // First extract the users string from the request body
      const usersString = req.body.users;

      // Then parse the actual array of users
      users = JSON.parse(usersString);

      if (!users) throw new Error("Empty user data");
      if (!Array.isArray(users))
        throw new Error("Users data should be an array");
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return res.status(400).json({
        error: "Invalid input format",
        details: "Expected { users: '[{id:1,...},{id:2,...}]' }",
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(currentDate.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    for (const user of users) {
      try {
        if (!user.id) {
          console.error("User object missing id:", user);
          continue;
        }

        const userData = await knex("users").where("id", user.id).first();
        if (!userData) {
          console.error(`User ${user.id} not found in database`);
          continue;
        }

        let userCourses;
        try {
          userCourses = await knex("course_assigned")
            .where({ user_id: user.id })
            .select("course_id", "end_date");
        } catch (dbError) {
          try {
            userCourses = await knex("course_assigned")
              .where({ userId: user.id })
              .select("course_id", "end_date");
          } catch (altError) {
            console.error(
              `Could not find user courses for ${user.id}`,
              altError
            );
            continue;
          }
        }

        const assignedCourses = await Promise.all(
          userCourses.map(async (course) => {
            const preferredName = await knex("course_contents")
              .where({ course_id: course.course_id })
              .orderBy(
                knex.raw(
                  "CASE WHEN lang_code IN ('en', 'en_UK') THEN 0 ELSE 1 END"
                )
              )
              .first()
              .select("name");

            return {
              end_date: course.end_date,
              name: preferredName?.name || "Unknown Course",
            };
          })
        );
        const atRiskCourses = assignedCourses
          .filter((course) => {
            if (!course.end_date) return false;

            const courseEndDate = new Date(course.end_date);
            courseEndDate.setHours(0, 0, 0, 0);

            const isOverdue = courseEndDate < currentDate;
            const isDueSoon = courseEndDate <= twoDaysFromNow;
            return isOverdue || isDueSoon;
          })
          .map((course) => {
            const courseEndDate = new Date(course.end_date);
            courseEndDate.setHours(0, 0, 0, 0);
            const isOverdue = courseEndDate < currentDate;

            return {
              name: course.name || "Unknown Course",
              endDate: courseEndDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              status: isOverdue ? "OVERDUE" : "DUE SOON",
              isOverdue,
            };
          });

        const data = await knex("users").where({ id: user.id }).first();

        if (!data) continue;

        if (atRiskCourses.length > 0) {
          const emailData = {
            name: user.fname || "Student",
            courses: atRiskCourses,
            endDate: atRiskCourses.some((c) => c.isOverdue),
            date: new Date().getFullYear(),
          };

          // try {
          //   const renderedEmail = compiledRisk(emailData);
          //   const emailSubject = "Your Coursework Is Overdue!";

          //   await sendMail(data.uemail, emailSubject, renderedEmail);
          // } catch (emailError) {
          //   console.error("Email error:", emailError);
          //   continue;
          // }
        }
      } catch (userError) {
        console.error("User processing error:", userError);
        continue;
      }
    }

    return res.status(200).json({ message: "Notification process completed" });
  } catch (error) {
    console.error("Global error:", error);
    return res.status(500).json({ error: "Error processing notifications" });
  }
};

exports.globalSearchData = async (req, res) => {
  try {
    const { searchTerm, role, email } = req.query;

    const data = await knex("users")
      .where({
        uemail: email,
      })
      .first();

    const organisation_id = data.organisation_id;
    const userId = data.id;

    if (!searchTerm || searchTerm.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 3 characters long",
      });
    }

    const results = {};
    const orgWhere = ["Superadmin", "Administrator"].includes(role)
      ? {}
      : { organisation_id };

    if (
      ["Superadmin", "Admin", "Faculty", "Observer", "Administrator"].includes(
        role
      )
    ) {
      results.users = await knex("users")
        .select(
          "id",
          "fname",
          "lname",
          "username",
          "uemail as email",
          "role",
          "user_thumbnail as thumbnail",
          knex.raw("'user' as type")
        )
        .where(function () {
          this.where("fname", "like", `%${searchTerm}%`)
            .orWhere("lname", "like", `%${searchTerm}%`)
            .orWhere("username", "like", `%${searchTerm}%`)
            .orWhere("uemail", "like", `%${searchTerm}%`);
        })
        .andWhere(orgWhere)
        .andWhere(function () {
          this.where("user_deleted", 0).orWhereNull("user_deleted");
        })
        .limit(10);
    }

    if (["Superadmin", "Administrator"].includes(role)) {
      results.organisations = await knex("organisations")
        .select(
          "id",
          "name",
          "org_email as email",
          "organisation_icon as thumbnail",
          knex.raw("'organisation' as type")
        )
        .where("name", "like", `%${searchTerm}%`)
        .orWhere("org_email", "like", `%${searchTerm}%`)
        .andWhere("organisation_deleted", 0)
        .limit(10);
    }
    if (["Superadmin", "Admin", "Faculty", "Observer", "User"].includes(role)) {
      const patientQuery = knex("patient_records")
        .select(
          "patient_records.id",
          "patient_records.name",
          "patient_records.email",
          "patient_records.phone",
          "patient_records.gender",
          "patient_records.category",
          "patient_records.patient_thumbnail as thumbnail",
          knex.raw("'patient' as type")
        )
        .where(function () {
          this.where("patient_records.name", "like", `%${searchTerm}%`)
            .orWhere("patient_records.email", "like", `%${searchTerm}%`)
            .orWhere("patient_records.phone", "like", `%${searchTerm}%`);
        })
        .andWhere("patient_records.deleted_at", null)
        .limit(10);

      if (role === "Superadmin") {
      } else if (role === "Admin") {
        patientQuery.andWhere(
          "patient_records.organisation_id",
          organisation_id
        );
      } else if (role === "Faculty" || role === "Observer") {
        patientQuery.andWhere(function () {
          this.where(
            "patient_records.organisation_id",
            organisation_id
          ).orWhere(
            "patient_records.additional_orgs",
            "like",
            `%${organisation_id}%`
          );
        });
      } else if (role === "User") {
        patientQuery
          .join(
            "assign_patient",
            "patient_records.id",
            "assign_patient.patient_id"
          )
          .where("assign_patient.user_id", userId)
          .andWhere("patient_records.organisation_id", organisation_id);
      }
      results.patients = await patientQuery;
    }

    if (["Superadmin", "Admin", "Faculty", "Observer"].includes(role)) {
      const investigationQuery = knex("investigation")
        .select(
          "id",
          "category",
          "test_name",
          "status",
          knex.raw("'investigation' as type")
        )
        .where(function () {
          this.where("category", "like", `%${searchTerm}%`).orWhere(
            "test_name",
            "like",
            `%${searchTerm}%`
          );
        })
        .limit(10);

      results.investigations = await investigationQuery;
    }

    if (["Superadmin", "Faculty", "Observer"].includes(role)) {
      const requestInvestigationQuery = knex("request_investigation")
        .select(
          "request_investigation.id",
          "patient_records.name as patient_name",
          "request_investigation.category",
          "request_investigation.test_name",
          "request_investigation.status",
          knex.raw("'request_investigation' as type")
        )
        .join(
          "patient_records",
          "request_investigation.patient_id",
          "patient_records.id"
        )
        .where(function () {
          this.where(
            "request_investigation.category",
            "like",
            `%${searchTerm}%`
          )
            .orWhere(
              "request_investigation.test_name",
              "like",
              `%${searchTerm}%`
            )
            .orWhere("patient_records.name", "like", `%${searchTerm}%`);
        })
        .limit(10);

      if (role === "Faculty" || role === "Observer") {
        requestInvestigationQuery.andWhere(function () {
          this.where(
            "patient_records.organisation_id",
            organisation_id
          ).orWhere(
            "patient_records.additional_orgs",
            "like",
            `%${organisation_id}%`
          );
        });
      }

      results.requestInvestigations = await requestInvestigationQuery;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during search",
      error: error.message,
    });
  }
};

// get all superadmin function
exports.getSuperadmins = async (req, res) => {
  try {
    const superadmins = await knex("users")
      .select("id", "fname", "lname", "uemail", "user_thumbnail")
      .where("role", "Superadmin")
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      });

    res.status(200).json(superadmins);
  } catch (error) {
    console.error("Error fetching superadmins:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAdministrators = async (req, res) => {
  try {
    const administrator = await knex("users")
      .select("id", "fname", "lname", "uemail", "user_thumbnail")
      .where("role", "Administrator")
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      });

    res.status(200).json(administrator);
  } catch (error) {
    console.error("Error fetching administrator:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.removeLoginTime = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await knex("users")
      .where(function () {
        this.where("uemail", username).orWhere("username", username);
      })
      .update({ lastLogin: null });

    res.status(200).send(user);
  } catch (error) {
    console.log("Error getting user", error);
    res.status(500).send({ message: "Error getting user" });
  }
};

// open webiste contact form save funciton
exports.createContact = async (req, res) => {
  const contact = req.body;

  try {
    if (
      !contact.name ||
      !contact.email ||
      !contact.subject ||
      !contact.message
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required contact fields" });
    }

    const newContact = {
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      created_at: new Date(),
    };

    await knex("contacts").insert(newContact);
    const data = await knex("settings").first();

    try {
      const emailData = {
        Name: contact.name,
        Message: contact.message,
        date: new Date().getFullYear(),
        logo: data.logo,
      };

      const renderedEmail = compiledContact(emailData);
      const activeRecipients = await knex("mails")
        .where({
          status: "active",
        })
        .select("email");

      for (const recipient of activeRecipients) {
        try {
          await sendMail(
            recipient.email,
            `New Contact Form Submission`,
            renderedEmail
          );
        } catch (recipientError) {
          console.log(
            `Failed to send email to ${recipient.email}:`,
            recipientError
          );
        }
      }
      await sendMail(
        process.env.ADMIN_EMAIL,
        "New Contact Form Submission",
        renderedEmail
      );
    } catch (emailError) {
      console.error("Failed to send contact notification email:", emailError);
    }

    return res
      .status(200)
      .json({ success: true, message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Error creating contact:", error);
    return res
      .status(500)
      .json({ success: false, message: "Contact submission error" });
  }
};

// get all contact details for display
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await knex("contacts")
      .select("contacts.*")
      .orderBy("contacts.id", "desc");

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error getting contacts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET translations
exports.getTranslations = (req, res) => {
  const { lang = "en_uk" } = req.query;
  const normalizedLang = lang.toLowerCase();

  const filePath = path.join(i18nDir, `${normalizedLang}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Language file not found" });
    }

    const data = fs.readFileSync(filePath, "utf8");
    const translations = JSON.parse(data);
    res.json(translations);
  } catch (err) {
    res.status(500).json({ error: "Failed to read translations" });
  }
};

// UPDATE translation
exports.updateTranslation = (req, res) => {
  const { key, value, lang = "en" } = req.body;
  const filePath = path.join(i18nDir, `${lang}.json`);

  if (!key || value === undefined) {
    return res.status(400).json({ error: "Key and value are required" });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Language file not found" });
    }

    const data = fs.readFileSync(filePath, "utf8");
    const translations = JSON.parse(data);

    if (!(key in translations)) {
      return res.status(404).json({ error: "Key not found" });
    }

    translations[key] = value;

    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2));

    res.json({ success: true, updated: { key, value, lang } });
  } catch (err) {
    res.status(500).json({ error: "Failed to update translation" });
  }
};

// save feedback form
exports.createFeedbackRequest = async (req, res) => {
  try {
    const { user_id, organisation_id, name, email, feedback = "[]" } = req.body;

    if (!name || !email || !feedback) {
      return res.status(400).json({
        success: false,
        message: "Name, email and feedback are required",
      });
    }

    const [id] = await knex("feedback_requests").insert({
      user_id,
      organisation_id,
      name,
      email,
      feedback,
      created_at: new Date(),
    });

    try {
      // ---- Email Section ----
      const org = await knex("organisations")
        .select("*")
        .where("id", organisation_id)
        .first();

      const settings = await knex("settings").first();

      // if (parsedSuperadminIds.length > 0) {
      const superadmins = await knex("mails").where({ status: "active" });

      const emailDataAdmin = {
        name,
        org: org?.name || "Unknown Organisation",
        feedback,
        email,
        created_at: new Date().toLocaleDateString("en-GB"),
        date: new Date().getFullYear(),
        logo:
          settings?.logo ||
          "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
      };

      // compile template and render HTML
      const renderedAdminMail = compiledFeedback(emailDataAdmin);

      for (const superadmin of superadmins) {
        if (superadmin.email) {
          await sendMail(
            superadmin.email,
            "New Feedback Received",
            renderedAdminMail
          );
          await sendMail(
            process.env.ADMIN_EMAIL,
            "New Feedback Received",
            renderedAdminMail
          );
        }
      }

      const renderedThanksMail = compiledThanks({
        name,
        feedback,
        org: org?.name || "Our Team",
        date: new Date().getFullYear(),
        logo:
          settings?.logo ||
          "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
      });

      await sendMail(email, "Thank you for your feedback", renderedThanksMail);
    } catch (emailError) {
      console.error("Failed to send feedback emails:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      id,
    });
  } catch (error) {
    console.error("Error creating feedback request:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// feedback list fectch funciton
exports.getFeedbackRequests = async (req, res) => {
  try {
    const feedbacks = await knex("feedback_requests")
      .select(
        "id",
        "user_id",
        "organisation_id",
        "name",
        "email",
        "feedback",
        "created_at",
        "updated_at"
      )
      .orderBy("created_at", "desc");

    return res.status(200).json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback requests:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// resend mail function
exports.resendActivationMail = async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({
      success: false,
      message: "User ID and email are required",
    });
  }

  try {
    // Fetch user + organisation
    const user = await knex("users").where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const org = await knex("organisations")
      .select("*")
      .where("id", user.organisation_id)
      .first();

    const passwordSetToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const url = `${process.env.CLIENT_URL}/reset-password?token=${passwordSetToken}&type=set`;
    const settings = await knex("settings").first();

    const emailData = {
      role: user.role,
      planType: org?.planType,
      name: user.fname,
      org: org?.name || "Unknown Organisation",
      url,
      username: user.uemail,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    if (org?.planType === "free") {
      const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      };

      const now = new Date(org?.created_at); // Make sure it's a Date object
      const after30Days = new Date(now); // This creates a copy

      after30Days.setDate(after30Days.getDate() + 30);

      emailData.currentDate = formatDate(now);
      emailData.expiryDate = formatDate(after30Days);

      console.log(now, "now");
      console.log(after30Days, "after30Days");
      console.log(formatDate(now), "formatDate(now)");
      console.log(formatDate(after30Days), "formatDate(after30Days)");
    }

    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(email, "Welcome back to InpatientSIM!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to resend email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Activation mail resent successfully",
    });
  } catch (error) {
    console.error("Error resending activation mail:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.generateReauthToken = async (req, res) => {
  try {
    const idToken = req.headers.authorization.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const reAuthToken = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(reAuthToken).digest("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let updatedCount = await knex("users").where({ firebase_uid: uid }).update({
      re_auth_token: hash,
      token_expiry: expiry,
    });

    if (updatedCount === 0) {
      updatedCount = await knex("users").where({ uemail: email }).update({
        firebase_uid: uid,
        re_auth_token: hash,
        token_expiry: expiry,
      });
    }

    if (updatedCount === 0) {
      return res.status(404).send({ error: "User record not found." });
    }

    res.status(200).send({
      message: "Re-auth token generated",
      reAuthToken: reAuthToken,
    });
  } catch (error) {
    console.error(`[GENERATE TOKEN] Error:`, error);
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.reAuthenticate = async (req, res) => {
  try {
    const { email, reAuthToken } = req.body;

    if (!reAuthToken || !email) {
      return res.status(401).send({ error: "Token and email are required." });
    }

    const hash = crypto.createHash("sha256").update(reAuthToken).digest("hex");

    const user = await knex("users").where({ uemail: email }).first();

    if (!user) {
      return res
        .status(401)
        .send({ error: "Invalid re-authentication token for this user." });
    }

    const areHashesEqual = user.re_auth_token === hash;

    if (!areHashesEqual) {
      return res
        .status(401)
        .send({ error: "Invalid re-authentication token for this user." });
    }

    if (new Date() > new Date(user.token_expiry)) {
      return res
        .status(401)
        .send({ error: "Expired re-authentication token." });
    }

    const customToken = await admin.auth().createCustomToken(user.firebase_uid);

    // await knex("users").where({ id: user.id }).update({
    //   re_auth_token: null,
    //   token_expiry: null,
    // });

    res.status(200).send({ customToken });
  } catch (error) {
    console.error("[RE-AUTH] Error:", error);
    res.status(401).send({ error: "Re-authentication failed" });
  }
};
