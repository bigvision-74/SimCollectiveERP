const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const sendMail = require("../helpers/mailHelper");
const ejs = require("ejs");
const fs = require("fs");

const VerificationEmail = fs.readFileSync(
  "./EmailTemplates/Verification.ejs",
  "utf8"
);

const compiledVerification = ejs.compile(VerificationEmail);

// login api and send otp on mail 
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res.status(200).json({ message: "User not found" });
    }

    if (user.user_deleted == 1) {
      return res.status(200).json({ message: "User account has been deleted" });
    }

    if (user.org_delete == 1) {
      return res.status(200).json({ message: "Organisation has been deleted" });
    }

    if (user.role.toLowerCase() !== "user") {
      return res.status(200).json({ message: "Access denied: not a user" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(200).json({ message: "Email and password do not match" });
    }

    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        username: user.username,
        uemail: user.uemail,
        role: user.role,
        user_thumbnail: user.user_thumbnail,
        organisation_id: user.organisation_id,
      },
    });
  } catch (error) {
    console.error("Error in logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// send otp APi
exports.sendOtpApi = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(200).json({ message: "Email is required" });
    }

    const user = await knex("users").where({ uemail: email }).first();

    if (!user) {
      return res.status(200).json({ message: "User not found" });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await knex("users")
      .where({ id: user.id })
      .update({
        verification_code: verificationCode,
        updated_at: knex.fn.now(),
      });

    const settings = await knex("settings").first();

    const emailData = {
      name: user.fname || user.username,
      code: verificationCode,
      date: new Date().getFullYear(),
      logo:
        settings?.logo ||
        "https://1drv.ms/i/c/c395ff9084a15087/EZ60SLxusX9GmTTxgthkkNQB-m-8faefvLTgmQup6aznSg",
    };

    // 5️⃣ Render email content and send
    const renderedEmail = compiledVerification(emailData);

    try {
      await sendMail(user.uemail, "Verify Your Device", renderedEmail);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
    }

    // 6️⃣ Respond to client
    res.status(200).json({
      success: true,
      message: "Verification code sent successfully.",
      email: user.uemail,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// otp verifiy api
exports.verifyApi = async (req, res) => {
  try {
    const { email, code, fcm_token } = req.body;

    // 1. Validate input
    if (!email || !code) {
      return res
        .status(400)
        .json({ success: false, message: "Email and verification code are required" });
    }

    // 2. Fetch user by email
    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    // 3. Check if OTP matches
    if (user.verification_code?.toString() !== code.toString()) {
      return res.status(200).json({ success: false, message: "Invalid verification code" });
    }

    // 4. Check if OTP expired (15 minutes)
    const now = new Date();
    const codeGeneratedAt = new Date(user.updated_at);
    const expirationTime = new Date(codeGeneratedAt.getTime() + 15 * 60 * 1000);
    if (now > expirationTime) {
      return res.status(200).json({ success: false, message: "Verification code has expired" });
    }

    // 5. Update user with FCM token, lastLogin, and clear verification code
    await knex("users").where({ uemail: email }).update({
      fcm_token,
      lastLogin: now,
      verification_code: null,
      updated_at: now,
    });

    // 6. Track last login in separate table
    const existingLogin = await knex("lastLogin").where({ userId: user.id }).first();
    if (existingLogin) {
      await knex("lastLogin").where({ userId: user.id }).update({
        login_time: now,
        updated_at: now,
      });
    } else {
      await knex("lastLogin").insert({
        userId: user.id,
        login_time: now,
        created_at: now,
        updated_at: now,
      });
    }

    // 7. Prepare response data
    const responseData = {
      id: user.id,
      role: user.role,
      organisation_id: user.organisation_id,
      lastLogin: now,
    };

    // 8. Send success response
    res.status(200).json({
      success: true,
      message: "Verification successful",
      user: responseData,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// get all patient by given user id by org id 
exports.getAllPatientsApi = async (req, res) => {
  try {
    const { userId, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(200).json({ success: false, message: "userId is required" });
    }

    const user = await knex("users").where({ id: userId }).first();

    if (!user) {
      return res.status(200).json({ success: false, message: "User not found" });
    }

    if (!user.organisation_id) {
      return res.status(200).json({ success: false, message: "User has no organisation assigned" });
    }

    const [{ count }] = await knex("patient_records")
      .where("organisation_id", user.organisation_id)
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .count("id as count");

    const patients = await knex("patient_records")
      .select("id", "name", "email", "phone", "date_of_birth", "gender", "type", "status")
      .where("organisation_id", user.organisation_id)
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .orderBy("id", "desc")
      .limit(limit)
      .offset(offset);

    res.status(200).json({
      success: true,
      totalPatients: parseInt(count, 10),
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      perPage: limit,
      data: patients,
    });
  } catch (error) {
    console.error("Error getting patient records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// session list get by user id api 
exports.getVirtualSessionByUserIdApi = async (req, res) => {
  try {
    const { userId } = req.body;

    // ✅ Validate input
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    // ✅ Step 1: Get all assigned patients for this user
    const assignedPatients = await knex("assign_patient")
      .where({ user_id: userId })
      .select("patient_id");

    if (!assignedPatients.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No patients assigned to this user",
      });
    }

    const patientIds = assignedPatients.map((p) => p.patient_id);

    // ✅ Step 2: Fetch sessions for those patients
    const sessions = await knex("virtual_section")
      .select(
        "id",
        "session_name",
        "patient_type",
        "selected_patient",
        "room_type",
        "session_time",
        "status",
      )
      .whereIn("selected_patient", patientIds)
      .andWhere({ status: "active" })
      .orderBy("id", "desc");

    // ✅ Step 3: Return formatted response
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching virtual sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch virtual sessions",
      error: error.message,
    });
  }
};
