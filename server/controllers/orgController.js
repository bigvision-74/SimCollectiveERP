const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const axios = require("axios");

const path = require("path");
const admin = require("firebase-admin");
const sendMail = require("../helpers/mailHelper");
require("dotenv").config();
const { uploadFile, deleteObject } = require("../services/S3_Services");
const fs = require("fs");
const ejs = require("ejs");
const contactEmail = fs.readFileSync(
  "./EmailTemplates/OfflineUser.ejs",
  "utf8"
);
const welcomeEmail = fs.readFileSync("./EmailTemplates/Welcome.ejs", "utf8");
const rejectEmail = fs.readFileSync("./EmailTemplates/Reject.ejs", "utf8");
const adminEmail = fs.readFileSync("./EmailTemplates/OfflineAdmin.ejs", "utf8");
const compiledUser = ejs.compile(contactEmail);
const compiledWelcome = ejs.compile(welcomeEmail);
const compiledReject = ejs.compile(rejectEmail);
const compiledAdmin = ejs.compile(adminEmail);
const jwt = require("jsonwebtoken");

function generateCode(length = 6) {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits[randomIndex];
  }
  return code;
}

async function generateOrganisationId(length = 12) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

exports.createOrg = async (req, res) => {
  const { orgName, email, icon, planType, amount, purchaseOrder } = req.body;

  if (!orgName && !email) {
    return res
      .status(400)
      .json({ message: "Org name and email are required." });
  }

  const organisation_id = await generateOrganisationId();

  try {
    const existingOrg = await knex("organisations")
      .where({ org_email: email })
      .first();

    if (existingOrg) {
      return res
        .status(400)
        .json({ message: "Email already associated with an organisation" });
    }

    const [id] = await knex("organisations").insert({
      name: orgName,
      organisation_id: organisation_id,
      org_email: email,
      organisation_icon: icon,
      organisation_deleted: false,
      planType: planType,
    });

    const payment = await knex("payment").insert({
      amount: amount,
      currency: "gbp",
      orgId: id,
      purchaseOrder: purchaseOrder || null,
    });

    res.status(201).json({ message: "Organisation added successfully" });
  } catch (error) {
    console.error("Error creating organisation:", error);
    res.status(500).json({ message: "Error creating organisation" });
  }
};

// exports.getAllOrganisation = async (req, res) => {
//   try {
//     const organisations = await knex("organisations")
//       .select("organisations.*")
//       .where(function () {
//         this.where("organisation_deleted", "<>", "deleted")
//           .orWhereNull("organisation_deleted")
//           .orWhere("organisation_deleted", "");
//       })
//       .orderBy("organisations.id", "desc");

//     res.status(200).send(organisations);
//   } catch (error) {
//     console.log("Error getting organisations", error);
//     res.status(500).send({ message: "Error getting organisations" });
//   }
// };




exports.getAllOrganisation = async (req, res) => {
  try {
    // Get all organisations that are not deleted
    const organisations = await knex("organisations")
      .select(
        "organisations.*",
        "p.amount",
        "p.currency",
        "p.created_at as payment_date",
        "users.password"
      )
      .leftJoin(
        // Subquery to get the latest payment per organisation
        knex("payment")
          .select("orgId")
          .max("created_at as latest_date")
          .groupBy("orgId")
          .as("latest"),
        "organisations.id",
        "latest.orgId"
      )
      .join("users", "users.organisation_id", "=", "organisations.id")
      .where("users.role", "Admin")
      .leftJoin("payment as p", function () {
        this.on("p.orgId", "organisations.id").andOn(
          "p.created_at",
          "=",
          "latest.latest_date"
        );
      })
      .where(function () {
        this.where("organisation_deleted", "<>", "deleted")
          .orWhereNull("organisation_deleted")
          .orWhere("organisation_deleted", "");
      })
      .orderBy("organisations.id", "desc");

    res.status(200).send(organisations);
  } catch (error) {
    console.log("Error getting organisations", error);
    res.status(500).send({ message: "Error getting organisations" });
  }
};



exports.deleteOrganisation = async (req, res) => {
  try {
    const ids = req.query.ids;

    if (!ids) {
      return res.status(400).json({ error: "No IDs provided for deletion." });
    }

    const idsArray = Array.isArray(ids) ? ids : ids.split(",");

    const idsToDelete = idsArray
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));

    if (idsToDelete.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid IDs provided for deletion." });
    }
    const result = await knex("organisations")
      .whereIn("id", idsToDelete)
      .update({ organisation_deleted: "deleted" });

    await knex("patient_records")
      .whereIn("organisation_id", idsToDelete)
      .update({ deleted_at: "deleted" });

    // await knex("courses1").whereIn("organisation_id", idsToDelete).update({ org_delete: 1 });
    // await knex("users") .whereIn("organisation_id", idsToDelete) .update({ org_delete: 1 });

    if (result > 0) {
      res
        .status(200)
        .json({ message: "Organisation(s) deleted successfully." });
    } else {
      res
        .status(404)
        .json({ message: "No organisations found with the provided IDs." });
    }
  } catch (error) {
    console.error("Error deleting organisation:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the organisation." });
  }
};

exports.getOrg = async (req, res) => {
  try {
    const id = req.params.id;

    const org = await knex("organisations")
      .leftJoin("payment", "organisations.id", "payment.orgId")
      .select("organisations.*", "payment.amount", "payment.purchaseOrder")
      .where(function () {
        this.where("organisations.id", id).orWhere(
          "organisations.organisation_id",
          id
        );
      })
      .andWhere(function () {
        this.where("organisations.organisation_deleted", "<>", "deleted")
          .orWhereNull("organisations.organisation_deleted")
          .orWhere("organisations.organisation_deleted", "");
      })
      .first();

    if (!org) {
      return res.status(404).json({ message: "Organisation not found." });
    }

    res.status(200).json(org);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching organisation." });
  }
};

exports.editOrganisation = async (req, res) => {
  const {
    name,
    organisation_id,
    org_email,
    id,
    organisation_icon,
    planType,
    amount,
    purchaseOrder,
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Organisation ID is required" });
  }

  if (!name || !organisation_id || !org_email) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const dataToUpdate = {
    name,
    org_email,
    organisation_icon: organisation_icon,
    planType: planType,
    updated_at: new Date(),
  };

  // if (organisation_icon) {
  //   const prevData = await knex("organisations").where("id", id).first();
  //   const key = prevData.organisation_icon.split("/").pop();
  //   const deleteResult = await deleteObject(key);

  //   dataToUpdate.organisation_icon = organisation_icon;
  // }

  try {
    const updatedRows = await knex("organisations")
      .where({ id })
      .update(dataToUpdate);
    await knex("payment").insert({
      amount: amount,
      currency: "gbp",
      orgId: id,
      purchaseOrder: purchaseOrder,
    });
    if (updatedRows) {
      res.status(200).json({ message: "Organisation updated successfully" });
    } else {
      res.status(404).json({ error: "Organisation not found" });
    }
  } catch (error) {
    console.error("Error updating organisation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUsersByOrganisation = async (req, res) => {
  try {
    const id = req.params.id;

    const users = await knex("users")
      .leftJoin("lastLogin", "lastLogin.userId", "=", "users.id")
      .select("users.*", "lastLogin.login_time as lastLoginTime")
      .where("organisation_id", id)
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
      .andWhere("role", "!=", "Superadmin")
      .orderBy("users.id", "desc");

    if (!users) {
      return res.status(404).json({ message: "Organisation not found." });
    }

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching organisation." });
  }
};

exports.checkInstitutionName = async (req, res) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Institution name is required." });
  }

  try {
    const existingOrg = await knex("organisations")
      .where(knex.raw("LOWER(name) = ?", name.toLowerCase()))
      .first();

    if (existingOrg) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking institution name:", error);
    res.status(500).json({ message: "Error checking institution name" });
  }
};

exports.checkEmail = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ message: "Email name is required." });
  }

  try {
    const existingOrg = await knex("organisations")
      .where(knex.raw("LOWER(org_email) = ?", email.toLowerCase()))
      .first();

    const existingreq = await knex("requests")
      .where(knex.raw("LOWER(email) = ?", email.toLowerCase()))
      .first();

    const existingUser = await knex("users")
      .where(knex.raw("LOWER(uemail) = ?", email.toLowerCase()))
      .first();

    if (existingOrg || existingreq || existingUser) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Error checking email" });
  }
};

exports.addRequest = async (req, res) => {
  const { institution, fname, lname, username, email, country, captcha, type } =
    req.body;
  const thumbnail = req.file;

  if (!institution || !fname || !lname || !username || !email) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!captcha) {
    return res.status(400).json({ message: "Captcha missing." });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    const verificationURL = "https://www.google.com/recaptcha/api/siteverify";

    // Use URLSearchParams for proper formatting
    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", captcha);

    const response = await axios.post(verificationURL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.data.success) {
      return res.status(400).json({ message: "Captcha verification failed." });
    }

    const userExists = await knex("users").where({ uemail: email }).first();
    if (userExists) {
      return res.status(200).json({ message: "Email already exists" });
    }

    const reqExists = await knex("requests").where({ email: email }).first();
    if (reqExists) {
      return res.status(200).json({ message: "Email already exists" });
    }

    const orgExists = await knex("organisations")
      .where({ org_email: email })
      .first();
    if (orgExists) {
      return res.status(200).json({ message: "Email already exists" });
    }

    if (type === "trial") {
      const emailDomain = email.split("@")[1];

      const domainExistsInUsers = await knex("users")
        .whereRaw("SUBSTRING_INDEX(uemail, '@', -1) = ?", [emailDomain])
        .first();

      const domainExistsInOrgs = await knex("organisations")
        .whereRaw("SUBSTRING_INDEX(org_email, '@', -1) = ?", [emailDomain])
        .first();

      const domainExistsInRequests = await knex("requests")
        .whereRaw("SUBSTRING_INDEX(email, '@', -1) = ?", [emailDomain])
        .first();

      if (domainExistsInUsers || domainExistsInOrgs || domainExistsInRequests) {
        return res.status(200).json({
          message:
            "This domain is already registered. Only one free account per domain is allowed.",
        });
      }
    }

    const code = generateCode();
    let image = null;

    if (thumbnail) {
      image = await uploadFile(thumbnail, "image", code);
    }
    // const image = await uploadFile(thumbnFail, "image", code);

    await knex("requests").insert({
      institution,
      fname,
      lname,
      username,
      email,
      country,
      type,
      thumbnail: image ? image.Location : null,
    });

    const settings = await knex("settings").first();

    const emailData = {
      name: fname + " " + lname,
      email: email,
      institution: institution,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    const emailData1 = {
      name: fname,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    const renderedEmail = compiledUser(emailData);
    const renderedEmail1 = compiledAdmin(emailData1);

    try {
      await sendMail(
        process.env.ADMIN_EMAIL,
        `New Request from ${fname} ${lname}`,
        renderedEmail
      );
      await sendMail(
        email,
        `Registration Received – Pending Approval`,
        renderedEmail1
      );

      const activeRecipients = await knex("mails")
        .where({
          status: "active",
        })
        .select("email");

      for (const recipient of activeRecipients) {
        try {
          await sendMail(
            recipient.email,
            `New Request from ${fname} ${lname}`,
            renderedEmail
          );
        } catch (recipientError) {
          console.log(
            `Failed to send email to ${recipient.email}:`,
            recipientError
          );
        }
      }
    } catch (emailError) {
      console.log("Failed to send email:", emailError);
    }

    res
      .status(201)
      .json({ success: true, message: "Request added successfully" });
  } catch (error) {
    console.error("Error adding request:", error);
    res.status(500).json({ message: "Error adding request" });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await knex("requests").orderBy("created_at", "desc");

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error getting requests:", error);
    res.status(500).json({ message: "Error getting requests" });
  }
};

exports.requestById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Request ID is required." });
  }

  try {
    const request = await knex("requests").where("id", id).first();

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error("Error getting request by ID:", error);
    res.status(500).json({ message: "Error getting request by ID" });
  }
};

exports.approveRequest = async (req, res) => {
  const { id: requestId } = req.params;
  const { planType, purchaseOrder, amount } = req.body;

  if (!requestId) {
    return res.status(400).json({ message: "Request ID is required." });
  }

  try {
    const request = await knex("requests").where("id", requestId).first();

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    const { institution, fname, lname, username, email, thumbnail } = request;

    const organisation_id = await generateOrganisationId();

    const [orgId] = await knex("organisations")
      .insert({
        name: institution,
        organisation_id: organisation_id,
        org_email: email,
        organisation_icon: thumbnail,
        planType: planType,
      })
      .returning("id");

    const [userId] = await knex("users")
      .insert({
        uemail: email,
        fname: fname,
        lname: lname,
        username: username,
        user_thumbnail: thumbnail,
        role: "Admin",
        password: 0,
        organisation_id: orgId,
        user_deleted: false,
      })
      .returning("id");

    const passwordSetToken = jwt.sign({ userId }, process.env.JWT_SECRET);
    const url = `${process.env.CLIENT_URL}/reset-password?token=${passwordSetToken}&type=set`;

    const settings = await knex("settings").first();

    const emailData = {
      role: "Admin",
      name: fname,
      org: institution || "Unknown Organisation",
      url,
      username: email,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
      planType: planType,
    };

    if (planType === "free") {
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
    } else {
      await knex("payment").insert({
        amount: amount,
        currency: "gbp",
        orgId: orgId,
        purchaseOrder: purchaseOrder || null,
      });
    }
    const renderedEmail = compiledWelcome(emailData);

    try {
      await sendMail(email, "Welcome to InpatientSIM!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    await knex("requests").where("id", requestId).delete();

    res.status(200).json({
      success: true,
      message: "Request approved and organisation created.",
    });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ message: "Error approving request" });
  }
};

exports.rejectRequest = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Request ID is required." });
  }

  try {
    const request = await knex("requests").where("id", id).first();

    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    await knex("requests").where("id", id).delete();
    const settings = await knex("settings").first();

    const emailData = {
      name: request.fname,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };
    const renderedEmail = compiledReject(emailData);

    try {
      await sendMail(request.email, "Request Rejected!", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    res
      .status(200)
      .json({ success: true, message: "Request rejected successfully." });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ message: "Error rejecting request" });
  }
};

exports.addMail = async (req, res) => {
  const { fname, lname, email } = req.body;

  if (!fname || !lname || !email) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    const existingMail = await knex("mails").where({ email }).first();
    if (existingMail) {
      return res
        .status(200)
        .json({ success: false, message: "Email already exists" });
    }

    await knex("mails").insert({
      fname,
      lname,
      email,
      status: "inactive",
    });

    res.status(201).json({ success: true, message: "Mail added successfully" });
  } catch (error) {
    console.error("Error adding mail:", error);
    res.status(500).json({ success: false, message: "Error adding mail" });
  }
};

exports.getAllMail = async (req, res) => {
  try {
    const mails = await knex("mails").orderBy("id", "desc");

    res.status(200).json(mails);
  } catch (error) {
    console.error("Error getting mails:", error);
    res.status(500).json({ message: "Error getting mails" });
  }
};

exports.updateMailStatus = async (req, res) => {
  const { status, id } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    await knex("mails").where({ id }).update({ status });

    res
      .status(200)
      .json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating mail status:", error);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

exports.checkUsername = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const existingUser = await knex("users")
      .where(knex.raw("LOWER(username) = ?", username.toLowerCase()))
      .first();

    const existingreq = await knex("requests")
      .where(knex.raw("LOWER(username) = ?", username.toLowerCase()))
      .first();

    if (existingUser || existingreq) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({ message: "Error checking username" });
  }
};

// exports.library = async (req, res) => {
//   const { username, investId } = req.params;

//   try {
//     const org = await knex("users").where({ uemail: username }).first();
//     if (!org) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const distinctImageUrls = await knex("investigation_reports")
//       .where("investigation_reports.investigation_id", investId)
//       .where("investigation_reports.value", "like", "https://insightxr.s3%")
//       .where("investigation_reports.organisation_id", org.organisation_id)
//       .select(knex.raw("DISTINCT investigation_reports.value AS value"));

//     const detailedDataPromises = distinctImageUrls.map(async (imageData) => {
//       let size = 0;
//       try {
//         const response = await axios.head(imageData.value);
//         if (response.headers["content-length"]) {
//           size = parseInt(response.headers["content-length"], 10);
//         }
//       } catch (error) {
//         console.error(
//           `Failed to get size for ${imageData.value}:`,
//           error.message
//         );
//       }

//       const fullFileName = imageData.value.substring(
//         imageData.value.lastIndexOf("/") + 1
//       );
//       const name = fullFileName.substring(fullFileName.lastIndexOf("-") + 1);

//       return {
//         url: imageData.value,
//         name: name,
//         size: size,
//       };
//     });

//     const detailedData = await Promise.all(detailedDataPromises);

//     res.status(200).json(detailedData);
//   } catch (error) {
//     console.log("Error", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.library = async (req, res) => {
  const { username, investId } = req.params;

  try {
    const org = await knex("users").where({ uemail: username }).first();
    if (!org) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Fetch S3 URLs from investigation_reports (existing logic)
    const distinctImageUrls = await knex("investigation_reports")
      .where("investigation_reports.investigation_id", investId)
      .where("investigation_reports.value", "like", "https://insightxr.s3%")
      .where("investigation_reports.organisation_id", org.organisation_id)
      .select(knex.raw("DISTINCT investigation_reports.value AS value"));

    // 2. Fetch images from image_library table based on investigation_id
    const libraryImages = await knex("image_library")
      .where("investigation_id", investId)
      .andWhere("status", "active") // optional: filter only active images
      .select("image_url", "id");

    // Combine both sources into a single array
    const combinedImages = [
      ...distinctImageUrls.map((item) => ({ url: item.value })),
      ...libraryImages.map((item) => ({ url: item.image_url })),
    ];

    // 3. Fetch size and name for all combined images
    const detailedDataPromises = combinedImages.map(async (imageData) => {
      let size = 0;
      try {
        const response = await axios.head(imageData.url);
        if (response.headers["content-length"]) {
          size = parseInt(response.headers["content-length"], 10);
        }
      } catch (error) {
        console.error(
          `Failed to get size for ${imageData.url}:`,
          error.message
        );
      }

      const fullFileName = imageData.url.substring(
        imageData.url.lastIndexOf("/") + 1
      );
      const name = fullFileName.substring(fullFileName.lastIndexOf("-") + 1);

      return {
        url: imageData.url,
        name: name,
        size: size,
      };
    });

    const detailedData = await Promise.all(detailedDataPromises);

    res.status(200).json(detailedData);
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
