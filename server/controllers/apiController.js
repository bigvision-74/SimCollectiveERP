<<<<<<< HEAD
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const sendMail = require("../helpers/mailHelper");
const ejs = require("ejs");
const fs = require("fs");
const { getIO } = require("../websocket");
const { io: ioClient } = require("socket.io-client");
const { secondaryApp } = require("../firebase");
const { uploadFile } = require("../services/S3_Services");
const path = require("path");
const OpenAI = require("openai");
const VerificationEmail = fs.readFileSync(
  "./EmailTemplates/Verification.ejs",
  "utf8",
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const compiledVerification = ejs.compile(VerificationEmail);

function getZoneColor(zoneName) {
  const zoneColors = {
    zone1: "#0ea5e9",
    zone2: "#5b21b6",
    zone3: "#fa812d",
    zone4: "#fad12c",
  };

  return zoneColors[zoneName] || null;
}

// login api and send otp on mail
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await knex("users").where({ uemail: email }).first();
    if (user) {
      const now = new Date();
      await knex("users").where({ uemail: email }).update({ lastLogin: now });
    }
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
      return res
        .status(200)
        .json({ message: "Email and password do not match" });
    }
    const orgName = await knex("organisations")
      .where({ id: user.organisation_id })
      .first();

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
        organisation_name: orgName.name,
      },
    });
  } catch (error) {
    console.error("Error in logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// send otp APi
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(200).json({ message: "Email is required" });
    }

    const user = await knex("users").where({ uemail: email }).first();

    if (!user) {
      return res.status(200).json({ message: "User not found" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await knex("users").where({ id: user.id }).update({
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
exports.verify = async (req, res) => {
  try {
    const { email, code, fcm_token } = req.body;

    // 1. Validate input
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    // 2. Fetch user by email
    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "User not found" });
    }

    // 3. Check if OTP matches
    if (user.verification_code?.toString() !== code.toString()) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid verification code" });
    }

    // 4. Check if OTP expired (15 minutes)
    const now = new Date();
    const codeGeneratedAt = new Date(user.updated_at);
    const expirationTime = new Date(codeGeneratedAt.getTime() + 15 * 60 * 1000);
    if (now > expirationTime) {
      return res
        .status(200)
        .json({ success: false, message: "Verification code has expired" });
    }

    // 5. Update user with FCM token, lastLogin, and clear verification code
    await knex("users").where({ uemail: email }).update({
      fcm_token,
      lastLogin: now,
      verification_code: null,
      updated_at: now,
    });

    // 6. Track last login in separate table
    const existingLogin = await knex("lastLogin")
      .where({ userId: user.id })
      .first();
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
exports.getAllPatients = async (req, res) => {
  try {
    const { userId, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const user = await knex("users").where({ id: userId }).first();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const assignedPatients = await knex("assign_patient")
      .where("user_id", userId)
      .pluck("patient_id");

    if (!assignedPatients.length) {
      return res.status(200).json({
        success: true,
        message: "No patients assigned to this user",
        totalPatients: 0,
        page: 1,
        totalPages: 1,
        perPage: 10,
        data: [],
      });
    }

    const [{ count }] = await knex("patient_records")
      .whereIn("id", assignedPatients)
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .count("id as count");

    const patients = await knex("patient_records")
      .select(
        "id",
        "name",
        "email",
        "phone",
        knex.raw("DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth"),
        "gender",
        "type",
        "category",
        "status",
      )
      .whereIn("id", assignedPatients)
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
    console.error("Error getting assigned patient records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// session list get by user id api
exports.getVirtualSessionByUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

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

// patient summary details api
exports.getPatientSummaryById = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res
        .status(400)
        .json({ success: false, message: "patientId is required" });
    }

    // Fetch patient data
    const patient = await knex("patient_records")
      .where({ id: patientId })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .first();

    if (!patient) {
      return res
        .status(200)
        .json({ success: false, message: "Patient not found" });
    }
    const calculateAge = (value) => {
      if (!value) return null;

      // If it's already a number (age)
      if (typeof value === "number" || !isNaN(value)) {
        return Number(value);
      }

      // If it's a date (DOB)
      const dob = new Date(value);
      if (isNaN(dob.getTime())) return null;

      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      return age;
    };

    // Structure the data into summary sections
    const summary = {
      ID: patient.id,
      "General Information": {
        Name: patient.name,
        Gender: patient.gender,
        Phone: patient.phone,
        Email: patient.email,
        Address: patient.address,
        Category: patient.category,
        Location: patient.scenario_location,
        "Room Type": patient.room_type,
      },
      "Clinical Information": {
        Height: patient.height,
        Weight: patient.weight,
        Age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : null,
        Ethnicity: patient.ethnicity,
        Nationality: patient.nationality,
        "Team Roles": patient.healthcare_team_roles,
        "Team Traits": patient.team_traits,
        "Patient Assessment": patient.patient_assessment,
      },
      "Social And Medical Background": {
        "Social Economic History": patient.social_economic_history,
        "Family Medical History": patient.family_medical_history,
        "Lifestyle And Home Situation": patient.lifestyle_and_home_situation,
      },
      "Equipment And Tests": {
        "Medical Equipment": patient.medical_equipment,
        Pharmaceuticals: patient.pharmaceuticals,
        "Diagnostic Equipment": patient.diagnostic_equipment,
        "Blood Tests": patient.blood_tests,
      },
      Observations: {
        "Initial Admission Observations":
          patient.initial_admission_observations,
        "Expected Observations":
          patient.expected_observations_for_acute_condition,
        "Recommended Observations During Event":
          patient.recommended_observations_during_event,
        "Observation Results Recovery": patient.observation_results_recovery,
        "Observation Results Deterioration":
          patient.observation_results_deterioration,
      },
      "Diagnosis And Treatment": {
        "Recommended Diagnostic Tests": patient.recommended_diagnostic_tests,
        "Treatment Algorithm": patient.treatment_algorithm,
        "Correct Treatment": patient.correct_treatment,
        "Expected Outcome": patient.expected_outcome,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching patient summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// patient note get by id Api
exports.getPatientNoteById = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }

    const notes = await knex("patient_notes")
      .where({ patient_id: patientId })
      .orderBy("created_at", "desc");

    if (notes.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const formattedNotes = notes.map((note) => ({
      ...note,
      created_at: note.created_at
        ? new Date(note.created_at)
          .toISOString()
          .replace("T", " ")
          .split(".")[0]
        : null,
      updated_at: note.updated_at
        ? new Date(note.updated_at)
          .toISOString()
          .replace("T", " ")
          .split(".")[0]
        : null,
    }));

    res.status(200).json({
      success: true,
      count: formattedNotes.length,
      data: formattedNotes,
    });
  } catch (error) {
    console.error("Error fetching patient notes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// patient note add and update Api
exports.addOrUpdatePatientNote = async (req, res) => {
  try {
    const {
      id,
      patient_id,
      doctor_id,
      organisation_id,
      title,
      content,
      report_id,
      sessionId,
      file,
    } = req.body;

    // Initial validation
    if (!patient_id || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "patient_id, title, and content are required",
      });
    }

    let noteId;
    let isNewNote = false;
    const userData = await knex("users").where({ id: doctor_id }).first();
    let attachment;
    let isNewAttachment = false;

    const isBase64 =
      typeof file === "string" &&
      file.length > 100 &&
      /^[A-Za-z0-9+/=\n\r]+$/.test(file.replace(/^data:[^;]+;base64,/, ""));

    if (isBase64) {
      console.log("📎 New attachment detected");

      let mimeType = "application/octet-stream";
      let base64Data = file;

      // Header present (web / some mobile SDKs)
      const headerMatch = file.match(/^data:([^;]+);base64,/);
      if (headerMatch) {
        mimeType = headerMatch[1];
        base64Data = file.replace(/^data:[^;]+;base64,/, "");
      }

      const buffer = Buffer.from(base64Data, "base64");

      console.log(`📦 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
      console.log(`🧾 File type: ${mimeType}`);

      if (buffer.length === 0) {
        throw new Error("Decoded file buffer is empty");
      }

      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds 10MB limit",
        });
      }

      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };

      const extension = mimeToExt[mimeType] || "bin";

      const originalName =
        req.body.file_name && req.body.file_name.trim()
          ? req.body.file_name
          : `upload_${Date.now()}.${extension}`;

      console.log(`📝 Saving as: ${originalName}`);

      const result = await uploadFile(
        {
          originalname: originalName,
          buffer,
          mimetype: mimeType,
        },
        "profiles",
      );

      attachment = result.Location;
      isNewAttachment = true;

      console.log("✅ Attachment uploaded:", attachment);
    } else {
      console.log("ℹ️ No valid base64 file provided");
    }
    if (id) {
      const updateData = {
        patient_id,
        doctor_id: doctor_id || null,
        organisation_id: organisation_id || null,
        title,
        content,
        report_id: report_id || null,
        updated_at: knex.fn.now(),
      };

      if (isNewAttachment && attachment) {
        updateData.attachments = attachment;
        console.log("🔄 Attachment updated in DB");
      } else {
        console.log("🔒 Keeping existing attachment");
      }

      const updated = await knex("patient_notes")
        .where({ id })
        .update(updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Note not found for update",
        });
      }
      noteId = id;
    } else {
      const [newNoteId] = await knex("patient_notes").insert({
        patient_id,
        doctor_id: doctor_id || null,
        organisation_id: organisation_id || null,
        title,
        content,
        attachments: attachment || null,
        report_id: report_id || null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });

      noteId = newNoteId;
      isNewNote = true;
    }
    const patientDetails = await knex("patient_records")
      .where({ id: patient_id })
      .first();

    let successMessage;

    if (noteId && sessionId && sessionId != 0) {
      const io = getIO();
      const roomName = `session_${sessionId}`;

      const notificationTitle = isNewNote ? "Note Added" : "Note Updated";
      const notificationBody = isNewNote
        ? `A new note has been added for patient ${patientDetails.name}`
        : `A note has been updated for patient ${patientDetails.name}`;
      io.to(roomName).emit("patientNotificationPopup", {
        roomName,
        title: notificationTitle,
        body: notificationBody,
        orgId: organisation_id,
        created_by: userData.username,
        patient_id: patient_id,
      });

      // io.to(roomName).emit("refreshPatientData");
      const socketData = {
        device_type: "App",
        notes: "update",
      };

      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2),
      );
      console.log("hitssssss");

      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: notificationTitle,
              body: `A note has been processed for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              noteId: String(noteId),
              type: "note_processed",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
            console.log(`✅ Notification sent to user ${user.id}`);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );

            const errorCode = notifErr.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              console.log(
                `Invalid FCM token for user ${user.id}. Removing from DB.`,
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_token: null });
            }
          }
        }
      }

      successMessage = isNewNote
        ? "Patient note added and notification sent successfully"
        : "Patient note updated and notification sent successfully";
    } else {
      successMessage = isNewNote
        ? "Patient note added successfully"
        : "Patient note updated successfully";
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        id: noteId,
        patient_id,
        doctor_id,
        organisation_id,
        title,
        content,
        report_id: report_id || null,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error adding/updating patient note:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete note Api
exports.deleteNoteById = async (req, res) => {
  try {
    const { noteId, userId, sessionId } = req.body;

    if (!noteId) {
      return res
        .status(400)
        .json({ success: false, message: "Note ID is required." });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    // Fetch note from DB
    const note = await knex("patient_notes").where({ id: noteId }).first();
    const userData = await knex("users").where({ id: userId }).first();

    if (!note) {
      return res
        .status(404)
        .json({ success: false, message: "Note not found." });
    }

    // Check if doctor_id matches userId
    if (parseInt(note.doctor_id) !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this note.",
      });
    }

    // Delete note
    await knex("patient_notes").where("id", noteId).del();

    const socketData = {
      device_type: "App",
      notes: "update",
    };
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );
    console.log("delete hittt");

    const notificationTitle = "Note Deleted";
    const notificationBody = `A Note (${note.title}) Deleted by ${userData.username}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: notificationTitle,
      body: notificationBody,
      orgId: note.organisation_id,
      created_by: userData.username,
      patient_id: note.patient_id,
    });

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete note.",
    });
  }
};

// investigation test name api
exports.getAllCategoriesInvestigationsById_old = async (req, res) => {
  try {
    const investigations = await knex("investigation")
      .leftJoin("users", "users.id", "=", "investigation.addedBy")
      .select(
        "investigation.id",
        "investigation.category",
        "investigation.test_name",
      )
      .where("investigation.status", "active")
      .orderBy("investigation.category", "asc");

    if (investigations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active investigations found",
      });
    }

    const grouped = investigations.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item.id,
        test_name: item.test_name,
      });
      return acc;
    }, {});

    const formattedData = Object.keys(grouped).map((category) => ({
      category_name: category,
      items: grouped[category],
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching grouped investigations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllCategoriesInvestigationsById = async (req, res) => {
  try {
    const { patient_id } = req.query;
    1;
    const investigations = await knex("investigation")
      .leftJoin("users", "users.id", "=", "investigation.addedBy")
      .select(
        "investigation.id",
        "investigation.category",
        "investigation.test_name",
      )
      .where("investigation.status", "active")
      .orderBy("investigation.category", "asc");

    if (investigations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active investigations found",
      });
    }

    let pendingTests = [];
    if (patient_id) {
      const pending = await knex("request_investigation")
        .select("category", "test_name")
        .where("patient_id", patient_id)
        .andWhere("status", "pending");

      pendingTests = pending.map(
        (t) => `${t.category?.toLowerCase()}|${t.test_name?.toLowerCase()}`,
      );
    }

    const grouped = investigations.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];

      // Check if this test is in pendingTests
      const isRequested = pendingTests.includes(
        `${category.toLowerCase()}|${item.test_name.toLowerCase()}`,
      );

      acc[category].push({
        id: item.id,
        test_name: item.test_name,
        is_requested: isRequested,
      });

      return acc;
    }, {});

    const formattedData = Object.keys(grouped).map((category) => ({
      category_name: category,
      items: grouped[category],
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching grouped investigations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.saveRequestedInvestigations = async (req, res) => {
  const investigations = req.body;

  try {
    if (!Array.isArray(investigations) || investigations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of investigations.",
      });
    }

    const errors = [];
    const insertableInvestigations = [];
    let sessionID = 0;
    let organisationId = 0;
    let patientId = 0;
    let requestBy = 0;
    let device_type = null;
    let wardSessionId = 0;

    for (let i = 0; i < investigations.length; i++) {
      const item = investigations[i];

      if (
        !item.patient_id ||
        !item.request_by ||
        !item.category ||
        !item.test_name ||
        !item.organisation_id
      ) {
        errors.push(`Entry ${i + 1}: Missing required fields`);
        continue;
      }

      const sessionId = item.sessionId || 0;
      sessionID = item.sessionId;
      organisationId = item.organisation_id;
      patientId = item.patient_id;
      requestBy = item.request_by;
      device_type = item.device_type;
      wardSessionId = item.wardSessionId;

      const testNames = Array.isArray(item.test_name)
        ? item.test_name
        : [item.test_name];

      for (let j = 0; j < testNames.length; j++) {
        const testName = testNames[j]?.trim();

        if (!testName) continue;

        const existing = await knex("request_investigation")
          .where({
            patient_id: item.patient_id,
            test_name: testName,
            status: "pending",
            organisation_id: item.organisation_id,
            session_id: sessionId,
          })
          .first();

        if (existing) {
          errors.push(`${testName} already requested`);
          continue;
        }

        insertableInvestigations.push({
          patient_id: item.patient_id,
          request_by: item.request_by,
          category: item.category,
          test_name: testName,
          status: "pending",
          organisation_id: item.organisation_id,
          session_id: sessionId,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    if (insertableInvestigations.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No investigations inserted (duplicates or missing fields).",
        insertedCount: 0,
        warnings: errors,
      });
    }
    const insertedTestNames = insertableInvestigations.map(
      (inv) => inv.test_name,
    );

    const existingRequests = await knex("request_investigation")
      .where("patient_id", patientId)
      .where("status", "!=", "complete")
      .whereIn("test_name", insertedTestNames)
      .select("test_name");

    const existingTestNames = existingRequests.map((r) => r.test_name);

    const pantientDetails = await knex("patient_records")
      .where("id", patientId)
      .first();

    const newRequests = insertedTestNames.filter(
      (item) => !existingTestNames.includes(item.test_name),
    );

    await knex("request_investigation").insert(insertableInvestigations);

    const socketData = {
      device_type: "App",
      request_investigation: "update",
    };
    const io = getIO();
    const roomName = `session_${sessionID}`;

    // const payload = {
    //   roomName,
    //   title: notificationTitle,
    //   body: notificationBody,
    //   orgId: organisationId,
    //   created_by: userdetail.username,
    //   patient_id: patientId,
    // };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );
    if (device_type == "App") {
      const approom = `org_${organisationId}`;
      const userdetail = await knex("users").where({ id: requestBy }).first();
      const notificationTitle = "New Investigation Request Recieved";
      const notificationBody = `A New Investigation Request Recieved by ${userdetail.username}`;
      const payload1 = {
        roomName,
        title: notificationTitle,
        body: notificationBody,
        orgId: organisationId,
        created_by: userdetail.username,
        patient_id: patientId,
      };
      io.to(approom).emit("virtualNotificationPopup", payload1);
    } else {
      const userdetail = await knex("users").where({ id: requestBy }).first();
      const notificationTitle1 = "New Investigation Request Added";
      const notificationBody1 = `A New Investigation Request Added by ${userdetail.username}`;
      const payload2 = {
        roomName,
        title: notificationTitle1,
        body: notificationBody1,
        orgId: organisationId,
        created_by: userdetail.username,
        patient_id: patientId,
      };
      io.to(roomName).emit("patientNotificationPopup", payload2);
      if (wardSessionId && wardSessionId != 0 && wardSessionId != null) {
        io.to(`ward_session_${wardSessionId}_supervisors`).emit(
          "patientNotificationPopup",
          payload2,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Investigations saved successfully",
      insertedCount: insertableInvestigations.length,
      warnings: errors,
    });
  } catch (error) {
    console.error("Error saving investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save investigations",
      error: error.message,
    });
  }
};

exports.getInvestigationsReportById = async (req, res) => {
  const { patientId, orgId } = req.query;

  try {
    if (!patientId || !orgId) {
      return res.status(400).json({
        success: false,
        message: "patientId and orgId are required.",
      });
    }

    const completedInvestigations = await knex("request_investigation as ri")
      .leftJoin("category as c", "ri.category", "c.name")
      .leftJoin("categorytest as inv", function () {
        this.on("inv.category", "=", "c.id").andOn(
          "ri.test_name",
          "=",
          "inv.name",
        );
      })
      .where({
        "ri.patient_id": patientId,
        "ri.organisation_id": orgId,
        "ri.status": "complete",
      })
      .select(
        "ri.id as request_id",
        "ri.category",
        "ri.test_name",
        "inv.id as investigation_id",
      )
      .orderBy("ri.created_at", "desc");

    // ✅ Group by category + test_name (remove duplicates)
    const groupedInvestigations = Object.values(
      completedInvestigations.reduce((acc, row) => {
        const key = `${row.category}-${row.test_name}`;
        if (!acc[key]) {
          acc[key] = {
            investigation_id: row.investigation_id || null,
            category: row.category,
            test_name: row.test_name,
            request_ids: [],
          };
        }
        acc[key].request_ids.push(row.request_id);
        return acc;
      }, {}),
    );

    // ✅ Return response
    res.status(200).json({
      success: true,
      message: "List fetched successfully.",
      count: groupedInvestigations.length,
      data: groupedInvestigations,
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

// all investigation resquest report Api
exports.getInvestigationReportData = async (req, res) => {
  const { patientId, reportId } = req.query;
  try {
    if (!patientId || !reportId) {
      return res.status(400).json({
        success: false,
        message: "patientId and reportId are required.",
      });
    }

    const reports = await knex("investigation_reports as ir")
      .join("patient_records as pr", "ir.patient_id", "pr.id")
      .leftJoin("investigation as inv", "ir.investigation_id", "inv.id")
      .leftJoin("testparameters as tp", function () {
        this.on("ir.parameter_id", "=", "tp.id").andOn(
          "ir.investigation_id",
          "=",
          "tp.investigation_id",
        );
      })
      .leftJoin("users as u", "ir.submitted_by", "u.id")
      .leftJoin(
        "request_investigation as req",
        "ir.request_investigation_id",
        "req.id",
      )
      .where("ir.patient_id", patientId)
      .andWhere("ir.investigation_id", reportId)
      .andWhere(function () {
        this.whereNull("pr.deleted_at").orWhere("pr.deleted_at", "");
      })
      .select(
        "inv.id as investigation_id",
        "req.id as request_id",
        "req.category",
        "req.test_name",
        "ir.id as report_id",
        "ir.request_investigation_id as request_investigation_id",
        "tp.name as parameter",
        "tp.units",
        "tp.field_type",
        "tp.normal_range",
        "ir.value",
        "ir.scheduled_date",
        "ir.created_at as date",
        "u.fname as user_fname",
        "u.lname as user_lname",
      )
      .orderBy("ir.created_at", "desc");

    // ✅ Fetch notes
    const notes = await knex("patient_notes as pn")
      .leftJoin("users as du", "pn.doctor_id", "du.id")
      .where("pn.patient_id", patientId)
      .andWhere("pn.report_id", reportId)
      .select(
        "pn.id",
        "pn.title",
        "pn.content",
        "pn.created_at",
        "du.fname as doctor_fname",
        "du.lname as doctor_lname",
      )
      .orderBy("pn.created_at", "desc");

    // ✅ No data found
    if (!reports.length && !notes.length) {
      return res.status(200).json({
        success: false,
        message: "No reports or notes found for this patient and report ID.",
      });
    }

    // ✅ Group results
    const groupedData = [];
    const groupedByTest = reports.reduce((acc, row) => {
      const key = `${row.category || "Unknown"}-${row.test_name || "Unknown"}`;
      if (!acc[key]) {
        acc[key] = {
          id: row.investigation_id,
          category: row.category,
          test_name: row.test_name,
          results: {},
        };
      }

      const testGroup = acc[key];
      const parameterName = row.parameter || `Parameter ${row.report_id}`;

      if (!testGroup.results[parameterName]) {
        testGroup.results[parameterName] = {
          parameter: parameterName,
          values: [],
          units: row.units || null,
          normal_range: row.normal_range || null,
          field_type: row.field_type || null,
        };
      }

      testGroup.results[parameterName].values.push({
        date: row.date
          ? new Date(row.date).toLocaleString("sv-SE").replace("T", " ")
          : null,
        scheduled_date: (() => {
          if (!row.scheduled_date) return null;

          const scheduled = new Date(row.scheduled_date);
          const now = new Date();
          const scheduledDateOnly = new Date(
            scheduled.toISOString().split("T")[0],
          );
          const todayDateOnly = new Date(now.toISOString().split("T")[0]);

          return scheduledDateOnly > todayDateOnly
            ? scheduled.toLocaleString("sv-SE").replace("T", " ")
            : null;
        })(),
        request_investigation_id: row.request_investigation_id,
        value: row.value,
        person_name:
          row.user_fname || row.user_lname
            ? `${row.user_fname || ""} ${row.user_lname || ""}`.trim()
            : null,
      });

      return acc;
    }, {});

    for (const key in groupedByTest) {
      const test = groupedByTest[key];
      test.results = Object.values(test.results);
      groupedData.push(test);
    }

    // ✅ Final response
    res.status(200).json({
      success: true,
      message: "Investigation report data fetched successfully.",
      count: groupedData.length,
      data: groupedData,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        created_at: new Date(n.created_at)
          .toLocaleString("sv-SE")
          .replace("T", " "),
        doctor_name:
          n.doctor_fname || n.doctor_lname
            ? `${n.doctor_fname || ""} ${n.doctor_lname || ""}`.trim()
            : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching investigation reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching investigation reports.",
    });
  }
};

// get all patient prescription data
exports.getPrescriptionsDataById = async (req, res) => {
  const { patientId } = req.query;

  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const prescriptions = await knex("prescriptions as p")
      .select(
        "p.id",
        "p.patient_id",
        "p.doctor_id",
        "p.medication_name",
        "p.indication",
        "p.description",
        "p.start_date",
        "p.days_given",
        "p.administration_time",
        "p.dose",
        "p.DrugGroup as drug_group",
        "p.DrugSubGroup as drug_sub_group",
        "p.TypeofDrug as type_of_drug",
        "p.route",
        "p.Way as way",
        "p.Duration as duration",
        "p.Unit as unit",
        "p.Frequency as frequency",
        "p.Instructions as instruction",
        "u.fname as doctor_fname",
        "u.lname as doctor_lname",
      )
      .leftJoin("users as u", "p.doctor_id", "u.id")
      .where("p.patient_id", patientId)
      .orderBy("p.created_at", "desc");

    const formattedData = prescriptions.map((item) => ({
      ...item,
      start_date: item.start_date
        ? new Date(item.start_date).toISOString().split("T")[0]
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Prescriptions fetched successfully.",
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching prescriptions by patient ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions.",
    });
  }
};

// get all medician list with dose Api
// exports.getAllMedicationsList = async (req, res) => {
//   try {
//     const medications = await knex("medications_list").select(
//       "id",
//       "medication",
//       "dose",
//     );

//     // const normalized = medications.map((m) => ({
//     //   ...m,
//     //   dose: JSON.parse(m.dose),
//     // }));

//     res.status(200).json({
//       success: true,
//       data: medications,
//     });
//   } catch (error) {
//     console.error("Error fetching medications:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// add Prescription api
exports.addPrescriptionApi = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      organisation_id,
      description,
      medication_name,
      indication,
      dose,
      dose_schedule,
      route,
      start_date,
      days_given,
      administration_time,
      sessionId,
      prescription_record_id,
      drug_group,
      drug_sub_group,
      type_of_drug,
      unit,
      way,
      frequency,
      instructions,
      duration,
    } = req.body;

    if (
      !patient_id ||
      !doctor_id ||
      !organisation_id ||
      !medication_name ||
      !dose ||
      !route ||
      !start_date ||
      !administration_time ||
      !drug_group ||
      !drug_sub_group ||
      !type_of_drug ||
      !unit ||
      !way ||
      !frequency ||
      !instructions ||
      !duration
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    let id;
    if (prescription_record_id) {
      await knex("prescriptions").where({ id: prescription_record_id }).update({
        patient_id,
        doctor_id,
        organisation_id,
        description,
        medication_name,
        indication,
        dose,
        dose_schedule: dose_schedule || null,
        route,
        DrugGroup: drug_group,
        DrugSubGroup: drug_sub_group,
        TypeofDrug: type_of_drug,
        Unit: unit,
        Way: way,
        Frequency: frequency,
        Instructions: instructions,
        Duration: duration,
        start_date,
        days_given,
        administration_time,
        updated_at: new Date(),
      });
      id = prescription_record_id;
    } else {
      const insertedIds = await knex("prescriptions").insert({
        patient_id,
        doctor_id,
        organisation_id,
        description,
        medication_name,
        indication,
        dose,
        dose_schedule: dose_schedule || null,
        route,
        DrugGroup: drug_group,
        DrugSubGroup: drug_sub_group,
        TypeofDrug: type_of_drug,
        Unit: unit,
        Way: way,
        Frequency: frequency,
        Instructions: instructions,
        Duration: duration,
        start_date,
        days_given,
        administration_time,
        created_at: new Date(),
        updated_at: new Date(),
      });
      id = insertedIds[0];
    }

    const userData = await knex("users").where({ id: doctor_id }).first();
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: prescription_record_id
        ? "Prescription Updated"
        : "Prescription Added",
      body: prescription_record_id
        ? `A New Prescription is updated by ${userData.username}`
        : `A New Prescription is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    console.log("prescriptions hittt");

    const patientDetails = await knex("patient_records")
      .where({ id: patient_id })
      .first();

    if (sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: prescription_record_id
                ? "New Prescription Updated"
                : "New Prescription Added",
              body: prescription_record_id
                ? `A Prescription has been updated for patient ${patientDetails.name}.`
                : `A new Prescription has been added for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              id: String(prescription_record_id),
              type: prescription_record_id
                ? "prescription_updated"
                : "prescription_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      prescription_record_id,
      message: prescription_record_id
        ? "Prescription updated successfully"
        : "Prescription added successfully",
    });
  } catch (error) {
    console.error("Error adding prescription:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.savefcmToken = async (req, res) => {
  try {
    const { fcmToken, userId } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ msg: "FCM Token not provided." });
    }

    const user = await knex("users").where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    await knex("users").where({ id: userId }).update({ fcm_token: fcmToken });

    res.status(200).json({ msg: "FCM token saved successfully." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// exports.getActiveSessionsList = async (req, res) => {
//   const { userId } = req.params;

//   if (!userId) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid user ID",
//     });
//   }

//   try {
//     const assignedPatients = await knex("assign_patient")
//       .where("user_id", userId)
//       .pluck("patient_id");

//     if (assignedPatients.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No assigned patients found",
//         data: [],
//       });
//     }

//     const activeSessions = await knex("session as s")
//       .join("users as u", "s.createdBy", "u.id")
//       .join("patient_records as p", "s.patient", "p.id")
//       .select(
//         "s.id",
//         "s.name as session_name",
//         knex.raw("CONCAT(u.fname, ' ', u.lname) as started_by"),
//         "p.name as patient_name",
//         "s.startTime",
//         knex.raw(
//           "DATE_ADD(s.startTime, INTERVAL s.duration MINUTE) as end_time",
//         ),
//         "s.patient as patient_id",
//         "s.state",
//         "s.duration",
//         knex.raw("NOW() as `current_time`"),
//       )
//       .where("s.state", "active")
//       .whereIn("s.patient", assignedPatients)
//       .orderBy("s.startTime", "desc");

//     const io = getIO();
//     const userLimit = 3;

//     const sessionsWithSlotData = await Promise.all(
//       activeSessions.map(async (session) => {
//         const sessionRoom = `session_${session.id}`;
//         let userCount = 0;

//         try {
//           const socketsInRoom = await io.in(sessionRoom).fetchSockets();
//           const usersInSession = socketsInRoom.filter(
//             (sock) => sock.user && sock.user.role.toLowerCase() === "user",
//           );

//           userCount = usersInSession.length;
//         } catch (e) {
//           console.error(
//             `[API] Error fetching sockets for room ${sessionRoom}:`,
//             e,
//           );
//           userCount = 0;
//         }

//         const availableSlots = Math.max(0, userLimit - userCount);
//         const isSlotAvailable = availableSlots > 0;

//         return {
//           ...session,
//           userCount,
//           availableSlots,
//           isSlotAvailable,
//         };
//       }),
//     );

//     // ✅ Add two dummy sessions with isSlotAvailable = false
//     const dummySessions = [
//       {
//         id: 9001,
//         session_name: "Cardio Checkup - Dummy 1",
//         started_by: "Sophia Brown",
//         patient_name: "Rahul Mehta",
//         startTime: "2025-11-07 09:00:00.000",
//         end_time: "2025-11-07 09:30:00.000",
//         patient_id: "271",
//         state: "active",
//         duration: "30",
//         current_time: new Date().toISOString(),
//         userCount: 3,
//         availableSlots: 0,
//         isSlotAvailable: false,
//       },
//       {
//         id: 9002,
//         session_name: "Neuro Observation - Dummy 2",
//         started_by: "Liam Johnson",
//         patient_name: "Meera Nair",
//         startTime: "2025-11-07 09:40:00.000",
//         end_time: "2025-11-07 10:10:00.000",
//         patient_id: "272",
//         state: "active",
//         duration: "30",
//         current_time: new Date().toISOString(),
//         userCount: 3,
//         availableSlots: 0,
//         isSlotAvailable: false,
//       },
//     ];

//     // ✅ Combine real and dummy sessions
//     const combinedData = [...sessionsWithSlotData];

//     return res.status(200).json({
//       success: true,
//       message: "Active sessions fetched successfully",
//       data: combinedData,
//     });
//   } catch (error) {
//     console.error("Error fetching active sessions:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// profile  update api
// exports.updateProfileApi = async (req, res) => {
//   try {
//     const { id, fname, lname, thumbnail } = req.body;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "id are required.",
//       });
//     }

//     const existingUser = await knex("users").where("id", id).first();
//     if (!existingUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     const updateData = {
//       fname,
//       lname,
//       updated_at: new Date(),
//     };

//     if (thumbnail) {
//       updateData.user_thumbnail = thumbnail;
//     }

//     await knex("users").where("id", id).update(updateData);

//     return res.status(200).json({
//       success: true,
//       message: "User profile updated successfully.",
//     });
//   } catch (error) {
//     console.error("Error updating user:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

exports.getActiveSessionsList = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    // ✅ Run base queries in parallel
    const [userData, assignedPatients] = await Promise.all([
      knex("users").where({ id: userId }).first(),
      knex("assign_patient").where("user_id", userId).pluck("patient_id"),
    ]);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const io = getIO();
    const userLimit = 3;

    // =============================
    // 1️⃣ ACTIVE NORMAL SESSIONS
    // =============================
    const activeSessions = await knex("session as s")
      .join("users as u", "s.createdBy", "u.id")
      .join("patient_records as p", "s.patient", "p.id")
      .select(
        "s.id",
        "s.name as session_name",
        knex.raw("CONCAT(u.fname, ' ', u.lname) as started_by"),
        "p.name as patient_name",
        "s.startTime",
        knex.raw(
          "DATE_ADD(s.startTime, INTERVAL s.duration MINUTE) as end_time",
        ),
        "s.patient as patient_id",
        "s.state",
        "s.duration",
        knex.raw("NOW() as `current_time`"),
      )
      .where("s.state", "active")
      .whereIn("s.patient", assignedPatients || [])
      .orderBy("s.startTime", "desc");

    const sessionsWithSlotData = await Promise.all(
      activeSessions.map(async (session) => {
        const sessionRoom = `session_${session.id}`;
        let userCount = 0;

        try {
          const sockets = await io.in(sessionRoom).fetchSockets();
          userCount = sockets.filter(
            (s) => s.user?.role?.toLowerCase() === "user",
          ).length;
        } catch (e) {
          console.error(`Socket error in ${sessionRoom}`, e);
        }

        const availableSlots = Math.max(0, userLimit - userCount);

        return {
          ...session,
          userCount,
          availableSlots,
          isSlotAvailable: availableSlots > 0,
          type: "session",
        };
      }),
    );

    // =============================
    // 2️⃣ WARD ZONE DATA (OPTIMIZED)
    // =============================

    const wardSessions = await knex("wardsession")
      .leftJoin(
        "wards",
        "wards.id",
        "=",
        knex.raw("CONVERT(wardsession.ward_id, UNSIGNED)"),
      )
      .where("wards.orgId", userData.organisation_id)
      .where("wardsession.status", "ACTIVE")
      .select("wards.*", "wardsession.*", "wardsession.id as wardsession_id");
    console.log(wardSessions, "wardSessionswardSessions")
    let zonePatientMap = []; // collect zone + patient ids

    for (const session of wardSessions) {
      if (!session.assignments || !session.users) continue;

      let usersArray;
      try {
        usersArray = JSON.parse(session.users);
      } catch {
        continue;
      }

      if (!usersArray.includes(Number(userId))) continue;

      let assignments;
      try {
        assignments = JSON.parse(session.assignments);
      } catch {
        continue;
      }

      for (let key in assignments) {
        if (
          key.startsWith("zone") &&
          Number(assignments[key].userId) === Number(userId)
        ) {
          const patientIds = assignments[key].patientIds || [];

          const startTime = session.start_time;
          const duration = session.duration;

          let endTime = null;

          if (startTime && duration) {
            const start = new Date(startTime);
            const end = new Date(start.getTime() + duration * 60000);
            endTime = end;
          }

          patientIds.forEach((pid) => {
            zonePatientMap.push({
              ward_name: session.name,
              wardsession_id: session.wardsession_id,
              zone_name: key,
              patient_id: pid,
              start_time: startTime,
              duration: duration,
              end_time: endTime,
            });
          });
        }
      }
    }

    // ✅ Fetch ALL patients in ONE query
    const uniquePatientIds = [
      ...new Set(zonePatientMap.map((z) => z.patient_id)),
    ];

    const patients = uniquePatientIds.length
      ? await knex("patient_records")
        .whereIn("id", uniquePatientIds)
        .select("id", "name")
      : [];

    const patientLookup = {};
    patients.forEach((p) => {
      patientLookup[p.id] = p.name;
    });

    console.log(zonePatientMap, "zonePatientMapzonePatientMap")
    const userZoneData = zonePatientMap.map((z) => ({
      id: String(z.wardsession_id),
      type: "ward",
      color_code: getZoneColor(z.zone_name),
      session_name: z.ward_name,
      patient_id: String(z.patient_id),
      patient_name: patientLookup[z.patient_id] || null,
      start_time: z.start_time
        ? new Date(z.start_time).toISOString().slice(0, 19).replace("T", " ")
        : null,

      end_time: z.end_time
        ? new Date(z.end_time).toISOString().slice(0, 19).replace("T", " ")
        : null,

      duration: z.duration,
      isSlotAvailable: true,
    }));

    // =============================
    // 3️⃣ FINAL RESPONSE
    // =============================

    const combinedData = [...sessionsWithSlotData, ...userZoneData];

    return res.status(200).json({
      success: true,
      message: "Active sessions fetched successfully",
      data: combinedData,
    });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.updateProfileApi = async (req, res) => {
  try {
    const { id, fname, lname, user_thumbnail } = req.body;

    if (!id) {
      console.warn("⚠️ Missing user id");
      return res.status(400).json({
        success: false,
        message: "id is required.",
      });
    }
    const updateData = {
      fname,
      lname,
      updated_at: new Date(),
    };

    if (user_thumbnail) {
      const base64Data = user_thumbnail.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      // if (buffer.length > 5 * 1024 * 1024) {
      //   console.warn("⚠️ Image exceeds 5MB limit");
      //   return res.status(400).json({
      //     success: false,
      //     message: "Image size too large",
      //   });
      // }

      const mimeTypeMatch = user_thumbnail.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      const extension = mimeType.split("/")[1] || "jpg";
      const result = await uploadFile(
        {
          originalname: `profile_${id}.${extension}`,
          buffer,
          mimetype: mimeType,
        },
        "profiles",
        id,
      );
      updateData.user_thumbnail = result.Location;
    } else {
      console.log("ℹ️ No thumbnail provided, skipping image upload");
    }

    await knex("users").where("id", id).update(updateData);
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    console.error("🔥 updateProfileApi error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.deleteToken = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }
    await knex("users").where({ id: userId }).update({ fcm_token: null });
    res
      .status(200)
      .json({ success: true, message: "FCM token deleted successfully" });
  } catch (error) {
    console.log("Error deleting FCM token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getObservationsDataById = async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const observations = await knex("observations")
      .leftJoin("users", "users.id", "observations.observations_by")
      .where({ patient_id: patientId })
      .select(
        "users.username as recorded_by",
        "observations.id",
        "observations.respiratory_rate",
        "observations.o2_sats",
        "observations.time_stamp as timestamp",
        "observations.oxygen_delivery",
        "observations.blood_pressure",
        "observations.pulse",
        "observations.consciousness as gcs",
        "observations.temperature",
        "observations.news2_score",
        "observations.pews2",
        "observations.mews2",
        "observations.created_at",
      )
      .orderBy("observations.created_at", "desc");

    return res.status(200).json({
      success: true,
      data: observations,
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.getOxygenDeliveryOptions = async (req, res) => {
  try {
    const OxygenDelivery = [
      "Room Air",
      "Nasal Cannula",
      "Simple Face Mask",
      "Venturi Mask",
      "Non-Rebreather Mask",
      "Partial Rebreather Mask",
      "High-Flow-Nasal Cannula (HFNC)",
      "CPAP",
      "BiPAP",
      "Mechanical Ventilation",
    ];

    return res.status(200).json(OxygenDelivery);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.addNewObservation = async (req, res) => {
  try {
    const {
      patient_id,
      recorded_by,
      timeStamp,
      respiratory_rate,
      o2_sats,
      oxygen_delivery,
      blood_pressure,
      pulse,
      gcs,
      temperature,
      news2Score,
      mews2,
      pews2,
      sessionId,
      observation_record_id,
    } = req.body;

    if (
      !patient_id ||
      !recorded_by ||
      !timeStamp ||
      !respiratory_rate ||
      !o2_sats ||
      !oxygen_delivery ||
      !blood_pressure ||
      !gcs ||
      !temperature ||
      !news2Score ||
      !mews2 ||
      !pews2 ||
      !pulse
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: recorded_by }).first();
    let id;

    if (observation_record_id) {
      await knex("observations").where({ id: observation_record_id }).update({
        patient_id,
        respiratory_rate,
        o2_sats,
        oxygen_delivery,
        blood_pressure,
        time_stamp: timeStamp,
        consciousness: gcs,
        temperature,
        news2_score: news2Score,
        pews2,
        mews2,
        pulse,
        organisation_id: userData.organisation_id,
        updated_at: new Date(),
      });

      // use existing id
      id = observation_record_id;
    } else {
      // insert returns array
      const insertedIds = await knex("observations").insert({
        patient_id,
        observations_by: recorded_by,
        respiratory_rate,
        o2_sats,
        oxygen_delivery,
        blood_pressure,
        time_stamp: timeStamp,
        consciousness: gcs,
        temperature,
        news2_score: news2Score,
        pews2,
        mews2,
        pulse,
        organisation_id: userData.organisation_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      id = insertedIds[0];
    }

    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: observation_record_id
        ? "Observation Updated"
        : "Observation Added",
      body: observation_record_id
        ? `A New Observation is updated by ${userData.username}`
        : `A New Observation is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      observations: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    const patientDetails = await knex("patient_records")
      .where({ id: patient_id })
      .first();

    if (id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: observation_record_id
                ? "Observation Updated"
                : "New Observation Added",
              body: observation_record_id
                ? `A new Observation has been updated for patient ${patientDetails.name}.`
                : `A new Observation has been added for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              id: String(id),
              type: observation_record_id
                ? "observation_updated"
                : "observation_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      id,
      message: observation_record_id
        ? "Observation Updated successfully"
        : "Observation added successfully",
    });
  } catch (error) {
    console.error("Error adding Observation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteObservationById = async (req, res) => {
  try {
    const { patientId, sessionId, observationId, userId } = req.body;

    if (!observationId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: userId }).first();

    await knex("observations").where({ id: observationId }).delete();

    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Observation Deleted",
      body: `A Observation is Deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      observations: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    const patientDetails = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Observation Deleted",
              body: `A Observation has been Deleted for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              type: "observation_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Observation Deleted successfully",
    });
  } catch (error) {
    console.error("Error Deleted Observation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getFluidRecords = async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const fluid_balance = await knex("fluid_balance")
      .leftJoin("users", "users.id", "fluid_balance.observations_by")
      .where({ patient_id: patientId })
      .select(
        "users.username as recorded_by",
        "fluid_balance.id",
        "fluid_balance.fluid_intake as type",
        "fluid_balance.type as subType",
        "fluid_balance.units",
        "fluid_balance.duration",
        "fluid_balance.route",
        "fluid_balance.timestamp",
        "fluid_balance.notes",
        "fluid_balance.created_at",
      )
      .orderBy("fluid_balance.created_at", "desc");

    return res.status(200).json(fluid_balance);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.getSubTypeOptions = async (req, res) => {
  try {
    const OxygenDelivery = [
      "Oral",
      "IV",
      "Colloid",
      "Blood Product",
      "NG",
      "PEG",
      "Urine",
      "Stool",
      "Emesis",
      "Drain",
      "Insensible Estimate",
    ];

    return res.status(200).json(OxygenDelivery);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.addFluidRecord = async (req, res) => {
  try {
    const {
      patient_id,
      recorded_by,
      type,
      sub_type,
      volume,
      rate_duration,
      route_site,
      timestamp,
      notes,
      sessionId,
      fluid_record_id,
    } = req.body;

    if (
      !patient_id ||
      !recorded_by ||
      !type ||
      !sub_type ||
      !volume ||
      !rate_duration ||
      !route_site ||
      !timestamp
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: recorded_by }).first();
    let id;
    if (fluid_record_id) {
      await knex("fluid_balance").where({ id: fluid_record_id }).update({
        patient_id,
        observations_by: recorded_by,
        fluid_intake: type,
        type: sub_type,
        units: volume,
        duration: rate_duration,
        route: route_site,
        timestamp,
        notes,
        organisation_id: userData.organisation_id,
        updated_at: new Date(),
      });

      id = fluid_record_id;
    } else {
      const insertedIds = await knex("fluid_balance").insert({
        patient_id,
        observations_by: recorded_by,
        fluid_intake: type,
        type: sub_type,
        units: volume,
        duration: rate_duration,
        route: route_site,
        timestamp,
        notes,
        organisation_id: userData.organisation_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      id = insertedIds[0];
    }
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: fluid_record_id ? "Fluid Balance Updated" : "Fluid Balance Added",
      body: fluid_record_id
        ? `A New Fluid Balance is updated by ${userData.username}`
        : `A New Fluid Balance is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      fluid_balance: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    const patientDetails = await knex("patient_records")
      .where({ id: patient_id })
      .first();

    if (id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: fluid_record_id
                ? "New Fluid Balance Updated"
                : "New Fluid Balance Added",
              body: fluid_record_id
                ? `A Fluid Balance has been updated for patient ${patientDetails.name}.`
                : `A new Fluid Balance has been added for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              id: String(id),
              type: fluid_record_id
                ? "fluid_balance_updated"
                : "fluid_balance_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      id,
      message: fluid_record_id
        ? "Fluid Balance updated successfully"
        : "Fluid Balance added successfully",
    });
  } catch (error) {
    console.error("Error adding Fluid Balance:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteFluidBalanceById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, fluidBalanceId } = req.body;

    if (!fluidBalanceId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: userId }).first();

    await knex("fluid_balance").where({ id: fluidBalanceId }).delete();

    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Fluid Balance Deleted",
      body: `A Fluid Balance is deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      fluid_balance: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    const patientDetails = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (fluidBalanceId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Fluid Balance deleted",
              body: `A Fluid Balance has been deleted for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(fluidBalanceId),
              type: "fluid_balance_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      fluidBalanceId,
      message: "Fluid Balance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted Fluid Balance:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deletePrescriptionById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, prescriptionId } = req.body;

    if (!prescriptionId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await knex("prescriptions").where({ id: prescriptionId }).delete();

    const userData = await knex("users").where({ id: userId }).first();
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Prescription Deleted",
      body: `A Prescription is deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    console.log("prescriptions hittt");

    const patientDetails = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (prescriptionId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Prescription Deleted",
              body: `A Prescription has been deleted for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(prescriptionId),
              type: "prescription_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      prescriptionId,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted prescription:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateInvestigationReportValues = async (req, res) => {
  const {
    reportId,
    userId,
    sessionId,
    patient_id,
    values = {},
    files = {},
    files_type = {},
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: "Invalid request. userId are required.",
    });
  }
  const io = getIO();
  try {
    const user = await knex("users")
      .select("organisation_id")
      .where("id", userId)
      .first();

    if (!user) {
      return res.status(400).json({
        error: `User with ID ${userId} not found.`,
      });
    }

    /* ---------------- HELPERS ---------------- */

    const isUrl = (val) => typeof val === "string" && /^https?:\/\//i.test(val);

    const isBase64 = (val) =>
      typeof val === "string" &&
      val.length > 100 &&
      /^[A-Za-z0-9+/=\n\r]+$/.test(val.replace(/^data:[^;]+;base64,/, ""));

    const uploadBase64ToS3 = async (base64, paramName, originalFileName) => {
      let mimeType = "application/octet-stream";
      let base64Data = base64;

      const headerMatch = base64.match(/^data:([^;]+);base64,/);
      if (headerMatch) {
        mimeType = headerMatch[1];
        base64Data = base64.replace(/^data:[^;]+;base64,/, "");
      }

      const buffer = Buffer.from(base64Data, "base64");

      if (!buffer.length) throw new Error("Empty file buffer");

      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB");
      }

      const safeName = originalFileName
        ? path
          .basename(originalFileName)
          .replace(/\s+/g, "_")
          .replace(/[^\w.-]/g, "")
        : `${paramName}_${Date.now()}`;

      const extension = path.extname(safeName) || "";

      const finalFileName = extension
        ? `${path.basename(safeName, extension)}_${Date.now()}${extension}`
        : `${safeName}_${Date.now()}`;

      const result = await uploadFile(
        {
          originalname: finalFileName,
          buffer,
          mimetype: mimeType,
        },
        "profiles",
      );

      return result.Location;
    };

    /* -------- FETCH EXISTING REPORT VALUES -------- */

    const oldReports = await knex("investigation_reports")
      .join(
        "testparameters",
        "testparameters.id",
        "investigation_reports.parameter_id",
      )
      .where({ request_investigation_id: reportId })
      .select(
        "testparameters.name",
        "investigation_reports.value",
        "investigation_reports.patient_id",
      );

    /* -------- UPDATE LOOP -------- */

    for (const report of oldReports) {
      const { name, value: oldValue } = report;
      let newValue = null;
      if (isUrl(oldValue) && files[name]) {
        const file = files[name];
        const fileNameFromClient = files_type[name];
        if (
          typeof file === "string" &&
          (file.startsWith("data:") || file.length > 200)
        ) {
          console.log(`📎 Uploading file for: ${name}`);
          newValue = await uploadBase64ToS3(file, name, fileNameFromClient);
        }
      } else if (!isUrl(oldValue) && values[name] !== undefined) {
        newValue = values[name];
      }

      if (!newValue || newValue === oldValue) continue;

      if (
        typeof newValue === "string" &&
        newValue.length > 200 &&
        !newValue.startsWith("http")
      ) {
        console.error("❌ BLOCKED base64 write to DB for:", name);
        continue;
      }

      await knex("investigation_reports")
        .where("request_investigation_id", reportId)
        .whereIn("parameter_id", function () {
          this.select("id").from("testparameters").where("name", name);
        })
        .update({ value: newValue });
    }

    /* -------- SOCKET UPDATE -------- */

    if (sessionId && Number(sessionId) !== 0) {
      const socketData = {
        device_type: "App",
        investigation_reports_test_data: "update",
      };

      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Investigation report updated successfully",
    });
  } catch (err) {
    console.error("❌ Update Investigation Error:", err);
    return res.status(500).json({
      error: "Failed to update investigation report",
      details: err.message,
    });
  }
};

exports.deleteInvestigationReportById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, investigationReportId } = req.body;

    if (!investigationReportId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await knex("request_investigation")
      .where({ id: investigationReportId })
      .delete();

    await knex("reportnotes")
      .where({ reportId: investigationReportId })
      .delete();

    await knex("investigation_reports")
      .where({ request_investigation_id: investigationReportId })
      .delete();

    const userData = await knex("users").where({ id: userId }).first();

    if (sessionId) {
      const io = getIO();
      const roomName = `session_${sessionId}`;

      io.to(roomName).emit("patientNotificationPopup", {
        roomName,
        title: "Investigation Report Deleted",
        body: `A Investigation Report is deleted by ${userData.username}`,
        orgId: userData.organisation_id,
        created_by: userData.username,
        patient_id: patientId,
      });

      // io.to(roomName).emit("refreshPatientData");
      const socketData = {
        device_type: "App",
        investigation_reports: "update",
      };

      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2),
      );
    }

    const patientDetails = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (investigationReportId && sessionId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Investigation Report Deleted",
              body: `A Investigation Report has been deleted for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(investigationReportId),
              type: "investigation_reports_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      investigationReportId,
      message: "Investigation Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted Investigation Report:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.addOrUpdateComment = async (req, res) => {
  try {
    const { id, patientId, report_id, userId, content, sessionId } = req.body;

    if (!patientId || !userId || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: userId }).first();
    let noteid;
    if (id) {
      await knex("reportnotes").where({ id: id }).update({
        note: content,
        addedBy: userId,
        updated_at: new Date(),
      });

      noteid = id;
    } else {
      const insertedIds = await knex("reportnotes").insert({
        note: content,
        addedBy: userId,
        reportId: report_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      noteid = insertedIds[0];
    }
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: id ? "Report Note Updated" : "Report Note Added",
      body: id
        ? `A New Report Note is updated by ${userData.username}`
        : `A New Report Note is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      notes: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    const patientDetails = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: id ? "Report Note Updated" : "New Report Note Added",
              body: id
                ? `A Report Note has been updated for patient ${patientDetails.name}.`
                : `A new Report Note has been added for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(id),
              type: id ? "note_updated" : "note_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      noteid,
      message: id
        ? "Report Note updated successfully"
        : "Report Note added successfully",
    });
  } catch (error) {
    console.error("Error adding Report Note:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteCommentById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, commentId } = req.body;

    if (!commentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await knex("reportnotes").where({ id: commentId }).delete();

    const userData = await knex("users").where({ id: userId }).first();
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Report Note Deleted",
      body: `A Report Note is deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      notes: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    console.log("Report Note hittt");

    const patientDetails = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (commentId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Report Note Deleted",
              body: `A Report Note has been deleted for patient ${patientDetails.name}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(commentId),
              type: "report_note_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      commentId,
      message: "Report Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted Report Note:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getComments = async (req, res) => {
  const { patientId, report_id, user_id } = req.body;

  if (!report_id) {
    return res.status(400).json({
      success: false,
      message: "Invalid report ID",
    });
  }

  try {
    const commentsRaw = await knex("reportnotes")
      .leftJoin("users", "users.id", "reportnotes.addedBy")
      .where({ reportId: report_id })
      .where({ addedBy: user_id })
      .select(
        "users.username as person_name",
        "reportnotes.id",
        "reportnotes.note as content",
        "reportnotes.created_at as timestamp",
      )
      .orderBy("reportnotes.created_at", "desc");

    const comments = commentsRaw.map((c) => ({
      ...c,
      timestamp: new Date(c.timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }));
    return res.status(200).json({
      success: true,
      data: comments,
    });
    // return res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list comments.",
    });
  }
};

exports.getDrugHierarchy = async (req, res) => {
  try {
    const rows = await knex("medications_list")
      .select("DrugGroup", "DrugSubGroup", "TypeofDrug", "medication", "dose")
      .orderBy("DrugGroup")
      .orderBy("DrugSubGroup")
      .orderBy("TypeofDrug");

    const safeValue = (val) =>
      val && String(val).trim() !== "" ? String(val).trim() : "NA";

    const hierarchy = [];

    for (const row of rows) {
      const drugGroupName = safeValue(row.DrugGroup);
      const subGroupName = safeValue(row.DrugSubGroup);
      const typeName = safeValue(row.TypeofDrug);
      const medName = safeValue(row.medication);
      const doseValue = safeValue(row.dose);

      // 1️⃣ Drug Group
      let group = hierarchy.find((g) => g.drug_group === drugGroupName);

      if (!group) {
        group = {
          drug_group: drugGroupName,
          sub_groups: [],
        };
        hierarchy.push(group);
      }

      // 2️⃣ Sub Group
      let subGroup = group.sub_groups.find(
        (sg) => sg.sub_group_name === subGroupName,
      );

      if (!subGroup) {
        subGroup = {
          sub_group_name: subGroupName,
          types: [],
        };
        group.sub_groups.push(subGroup);
      }

      // 3️⃣ Type
      let type = subGroup.types.find((t) => t.type_name === typeName);

      if (!type) {
        type = {
          type_name: typeName,
          medications: [],
        };
        subGroup.types.push(type);
      }

      // 4️⃣ Medication
      type.medications.push({
        name: medName,
        doses: doseValue,
      });
    }

    return res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error("Drug hierarchy error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build drug hierarchy",
    });
  }
};

// exports.generateQuestionResponse = async (req, res) => {
//   const { patientId, question } = req.body;

//   if (!patientId || !question) {
//     return res.status(400).json({
//       success: false,
//       message: "Patient ID and question are required",
//     });
//   }

//   try {
//     const patientData = await knex("patient_records")
//       .where({ id: patientId })
//       .first();

//     if (!patientData) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     /* ---------- AGE DETECTION ---------- */

//     let age = null;

//     if (patientData.date_of_birth) {
//       const dobValue = patientData.date_of_birth;

//       // if value is numeric -> it's already age
//       if (!isNaN(dobValue)) {
//         age = Number(dobValue);
//       }
//       // otherwise assume it's a date
//       else {
//         const dob = new Date(dobValue);
//         const diff = Date.now() - dob.getTime();
//         const ageDate = new Date(diff);
//         age = Math.abs(ageDate.getUTCFullYear() - 1970);
//       }
//     }

//     /* ---------- VOICE TYPE ---------- */

//     const getVoiceType = (gender) => {
//       const voiceMap = {
//         Male: "male",
//         Female: "female",
//         "Transgender Male": "male",
//         "Transgender Female": "female",
//         Demiboy: "male",
//         Demigirl: "female",
//       };

//       return voiceMap[gender] || "neutral";
//     };

//     const voice = getVoiceType(patientData.gender);

//     /* ---------- VOICE STYLE (AGE BASED) ---------- */

//     const getVoiceStyle = (age) => {
//       if (!age) return "adult";
//       if (age <= 12) return "child";
//       if (age <= 18) return "teen";
//       if (age <= 60) return "adult";
//       return "elderly";
//     };

//     const voice_style = getVoiceStyle(age);

//     /* ---------- AI PROMPT ---------- */

//     const prompt = `
// You are roleplaying as a patient in a hospital.

// Answer the question exactly as the PATIENT would respond to a nurse.

// Rules:
// - Speak in first person.
// - Keep responses short and natural.
// - Age: ${age || "unknown"}
// - Gender: ${patientData.gender}

// Patient Details:
// ${JSON.stringify(patientData, null, 2)}

// Nurse Question:
// ${question}

// Patient Response:
// `;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4.1-mini",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are roleplaying as a hospital patient answering questions from a nurse.",
//         },
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       temperature: 0.6,
//     });

//     const answer = completion.choices[0].message.content;
//     const getTTSVoice = (voice, voice_style) => {
//       if (voice === "neutral") {
//         return "neutral";
//       }

//       const voiceMap = {
//         male: {
//           child: "young male",
//           teen: "young male",
//           adult: "male",
//           elderly: "slow male",
//         },
//         female: {
//           child: "young female",
//           teen: "young female",
//           adult: "female",
//           elderly: "slow female",
//         },
//       };

//       return voiceMap[voice]?.[voice_style] || voice;
//     };

//     const tts_voice = getTTSVoice(voice, voice_style);
//     return res.status(200).json({
//       success: true,
//       answer,
//       tts_voice,
//     });
//   } catch (error) {
//     console.error("Error generating AI response:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Error generating AI response",
//     });
//   }
// };


exports.generateQuestionResponse = async (req, res) => {
  const { patientId, userId, sessionId, question } = req.body;

  if (!patientId || !question || !userId) {
    return res.status(400).json({
      success: false,
      message: "Patient ID, User ID, Session ID, and question are required",
    });
  }
  const io = getIO();
  try {
    const patientData = await knex("patient_records")
      .where({ id: patientId })
      .first();

    if (!patientData) {
      console.warn(`[generateQuestionResponse] Patient not found — patientId: ${patientId}`);
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    /* ---------- AGE & VOICE LOGIC (Condensed for brevity) ---------- */
    let age = null;
    if (patientData.date_of_birth) {
      const dobValue = patientData.date_of_birth;
      if (!isNaN(dobValue)) { age = Number(dobValue); }
      else {
        const dob = new Date(dobValue);
        age = Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970);
      }
    }

    const getVoiceType = (gender) => {
      const voiceMap = { Male: "male", Female: "female", "Transgender Male": "male", "Transgender Female": "female" };
      return voiceMap[gender] || "neutral";
    };
    const voice = getVoiceType(patientData.gender);
    const voice_style = age <= 12 ? "child" : age <= 18 ? "teen" : age <= 60 ? "adult" : "elderly";

    const patientFacts = {
      name:
        patientData.name ||
        [patientData.fname, patientData.lname].filter(Boolean).join(" ").trim() ||
        patientData.username ||
        null,
      age,
      gender: patientData.gender || null,
      phone: patientData.phone || null,
      email: patientData.email || null,
      address: patientData.address || null,
      category: patientData.category || null,
      location: patientData.scenario_location || null,
      room_type: patientData.room_type || null,
      height: patientData.height || null,
      weight: patientData.weight || null,
      ethnicity: patientData.ethnicity || null,
      nationality: patientData.nationality || null,
      healthcare_team_roles: patientData.healthcare_team_roles || null,
      team_traits: patientData.team_traits || null,
      patient_assessment: patientData.patient_assessment || null,
      social_economic_history: patientData.social_economic_history || null,
      family_medical_history: patientData.family_medical_history || null,
      lifestyle_and_home_situation: patientData.lifestyle_and_home_situation || null,
      medical_equipment: patientData.medical_equipment || null,
      pharmaceuticals: patientData.pharmaceuticals || null,
      diagnostic_equipment: patientData.diagnostic_equipment || null,
      blood_tests: patientData.blood_tests || null,
      initial_admission_observations: patientData.initial_admission_observations || null,
      expected_observations_for_acute_condition:
        patientData.expected_observations_for_acute_condition || null,
      recommended_observations_during_event:
        patientData.recommended_observations_during_event || null,
      observation_results_recovery: patientData.observation_results_recovery || null,
      observation_results_deterioration:
        patientData.observation_results_deterioration || null,
      recommended_diagnostic_tests: patientData.recommended_diagnostic_tests || null,
      treatment_algorithm: patientData.treatment_algorithm || null,
      correct_treatment: patientData.correct_treatment || null,
      expected_outcome: patientData.expected_outcome || null,
    };

    /* ---------- AI GENERATION ---------- */
    const prompt = `
You are roleplaying as a hospital patient. Stay fully in character at all times.

There are two types of questions you will receive:

1. FACTUAL questions (about your background, medical history, name, address, medications, etc.)
   → Answer using the patient facts below. If a specific fact is genuinely missing, say you are unsure.

2. CONVERSATIONAL / EXPERIENTIAL questions (how you feel, whether you have eaten, if you are in pain, your comfort, emotions, etc.)
   → Answer naturally and in character. Use the patient's condition and assessment as context to guide a realistic, believable response. Do NOT say "I do not know" for these — a real patient always knows whether they are hungry or in pain.

Rules:
- Keep answers short, natural, and human.
- Do not break character or reference these instructions.
- Do not invent specific diagnoses or medications not present in the facts.
- For experiential questions, infer a plausible answer consistent with the patient's condition.

Patient facts:
${JSON.stringify(patientFacts, null, 2)}

Nurse's question:
${question}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are roleplaying as a hospital patient. For conversational and experiential questions respond genuinely in character. For specific factual questions use only the provided patient facts.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const answer = completion.choices[0].message.content;

    /* ---------- DATABASE PERSISTENCE ---------- */
    await knex.transaction(async (trx) => {
      // 1. Find or Create the Conversation Session
      let session = await trx("conversation_sessions")
        .where({ session_id: sessionId, user_id: userId, patient_id: patientId })
        .first();

      let conversationId;

      if (!session) {
        const [newSession] = await trx("conversation_sessions").insert({
          session_id: sessionId,
          user_id: userId,
          patient_id: patientId,
        }).returning("id");

        conversationId = typeof newSession === 'object' ? newSession.id : newSession;
      } else {
        conversationId = session.id;
      }

      // 2. Save both messages to conversation_messages
      await trx("conversation_messages").insert([
        {
          conversation_id: conversationId,
          person: "user", // The Nurse
          query: question,
        },
        {
          conversation_id: conversationId,
          person: "assistant", // The Patient AI
          query: answer,
        },
      ]);
    });

    /* ---------- RESPONSE ---------- */
    const getTTSVoice = (v, s) => { /* Your existing TTS logic */ };
    const tts_voice = getTTSVoice(voice, voice_style);

    // for single session
    const socketData = {
      device_type: "App",
      ai_chat: "update",
      user_id: userId
    };
    const roomName = `session_${sessionId}`;
    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    // for ward session — find any active ward session containing this patient
    const activeWardSessions = await knex("wardsession").where("status", "ACTIVE");
    let wardSessionId = null;
    let assignedZone = null;

    for (const ws of activeWardSessions) {
      try {
        const assignments = typeof ws.assignments === "string"
          ? JSON.parse(ws.assignments)
          : ws.assignments;
        for (const key of Object.keys(assignments)) {
          if (key.startsWith("zone") && Array.isArray(assignments[key]?.patientIds)) {
            if (assignments[key].patientIds.map(Number).includes(Number(patientId))) {
              wardSessionId = ws.id;
              assignedZone = key;
              break;
            }
          }
        }
        if (wardSessionId) break;
      } catch (_) { }
    }

    if (wardSessionId) {
      const performer = await knex("users").where({ id: userId }).select("username", "role").first();
      const zoneNumber = assignedZone.replace("zone", "");
      const wardPayload = {
        sessionId: wardSessionId,
        performedByUserId: userId,
        performerRole: performer?.role || null,
        performerName: performer?.username || null,
        isRefresh: true,
        patientId: patientId,
        patientName: patientData?.name || "Patient",
        assignedRoom: zoneNumber || "all",
        category: "AIChat",
        action: "added",
      };
      const wardIo = global.wardIo;
      wardIo.to(`ward_session_${wardSessionId}_zone_${zoneNumber}`).emit("patient_data_updated", {
        ...wardPayload,
        json: JSON.stringify(wardPayload),
      });
    } else {
      console.log(`No active ward session found for patientId: ${patientId} — skipping ward socket emit`);
    }

    return res.status(200).json({
      success: true,
      answer,
      tts_voice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error generating AI response",
    });
  }
};

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { userId } = req.body;
    const userDeatails = await knex("users").where("id", userId).first();
    const orgDetails = await knex("organisations")
      .where("id", userDeatails.organisation_id)
      .first();

    if (!userDeatails) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const patients = await knex("patient_records")
      .where({ organisation_id: userDeatails.organisation_id })
      .select("id", "date_of_birth")
      .orderBy("created_at", "desc");

    // Calculate age groups
    const ageGroups = {
      "0-18": 0,
      "19-35": 0,
      "38-50": 0,
      "51+": 0,
    };

    patients.forEach((patient) => {
      let age = 0;
      if (!isNaN(patient.date_of_birth)) {
        age = Number(patient.date_of_birth);
      } else {
        const dob = new Date(patient.date_of_birth);
        const currentYear = new Date().getFullYear();
        age = currentYear - dob.getFullYear();
      }

      if (age <= 18) {
        ageGroups["0-18"]++;
      } else if (age >= 19 && age <= 35) {
        ageGroups["19-35"]++;
      } else if (age >= 38 && age <= 50) {
        ageGroups["38-50"]++;
      } else if (age > 50) {
        ageGroups["51+"]++;
      }
    });

    const ageGroupsArray = [
      { label: "0-18", value: ageGroups["0-18"], color_code: "#629BAA" },
      { label: "19-35", value: ageGroups["19-35"], color_code: "#D7EAF0" },
      { label: "38-50", value: ageGroups["38-50"], color_code: "#B9D7DF" },
      { label: "51+", value: ageGroups["51+"], color_code: "#F9A8A8" },
    ];

    // 🔹 Get total + status counts in ONE query
    const countsData = await knex("request_investigation")
      .where("request_by", userId)
      .select(
        knex.raw("COUNT(*) as total"),
        knex.raw("SUM(status = 'pending') as pending"),
        knex.raw("SUM(status = 'complete') as complete"),
      )
      .first();

    const counts = {
      total: Number(countsData.total) || 0,
      pending: Number(countsData.pending) || 0,
      complete: Number(countsData.complete) || 0,
    };

    const sessions = await knex("session")
      .select(
        knex.raw("DATE_FORMAT(startTime, '%Y-%m') as month"),
        knex.raw("COUNT(*) as sessionCount"),
      )
      .whereRaw("JSON_CONTAINS(participants, JSON_OBJECT('id', ?), '$')", [
        Number(userId),
      ])
      .groupByRaw("DATE_FORMAT(startTime, '%Y-%m')");

    // 🔹 Ward Sessions
    const wardSessions = await knex("wardsession")
      .select(
        knex.raw("DATE_FORMAT(start_time, '%Y-%m') as month"),
        knex.raw("COUNT(*) as wardSessionCount"),
      )
      .where(function () {
        this.whereRaw(
          "JSON_CONTAINS(assignments->'$.faculty', JSON_ARRAY(?))",
          [Number(userId)],
        )
          .orWhereRaw(
            "JSON_CONTAINS(assignments->'$.Observer', JSON_ARRAY(?))",
            [Number(userId)],
          )
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone1.userId') = ?", [
            Number(userId),
          ])
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone2.userId') = ?", [
            Number(userId),
          ])
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone3.userId') = ?", [
            Number(userId),
          ])
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone4.userId') = ?", [
            Number(userId),
          ]);
      })
      .groupByRaw("DATE_FORMAT(start_time, '%Y-%m')");

    // 🔹 Session details where userId is a participant
    const sessionDetails = await knex("session")
      .join("patient_records", "session.patient", "patient_records.id")
      .select(
        "session.id",
        "session.name as title",
        "patient_records.name as patient_name",
        "session.startTime as date",
        "session.duration",
      )
      .whereRaw("JSON_CONTAINS(participants, JSON_OBJECT('id', ?), '$')", [
        Number(userId),
      ])
      .orderBy("session.startTime", "desc")
      .limit(5);

    const formattedSessions = sessionDetails.map((s) => ({
      id: String(s.id),
      title: s.title,
      patient_name: s.patient_name,
      date: s.date ? new Date(s.date).toISOString().split("T")[0] : null,
      duration: s.duration ? `${s.duration} mins` : null,
    }));

    // 🔥 Convert to object map
    const resultMap = {};

    sessions.forEach((item) => {
      if (!resultMap[item.month]) {
        resultMap[item.month] = {
          month: item.month,
          sessionCount: 0,
          wardSessionCount: 0,
        };
      }
      resultMap[item.month].sessionCount = Number(item.sessionCount);
    });

    wardSessions.forEach((item) => {
      if (!resultMap[item.month]) {
        resultMap[item.month] = {
          month: item.month,
          sessionCount: 0,
          wardSessionCount: 0,
        };
      }
      resultMap[item.month].wardSessionCount = Number(item.wardSessionCount);
    });

    const finalResult = Object.values(resultMap).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    return res.status(200).json({
      organisation_id: orgDetails.organisation_id,
      monthly_session_count: finalResult,
      investigations: [
        {
          label: "total",
          value: counts.total,
          color_code: "#5CACE0",
        },
        {
          label: "pending",
          value: counts.pending,
          color_code: "#5EA3B7",
        },
        {
          label: "complete",
          value: counts.complete,
          color_code: "#8DC3D2",
        },
      ],
      age_groups: ageGroupsArray,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("Error while getting counts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.saveOximeterReadings = async (req, res) => {
  try {
    const { patient_id, sp02, perfusion_index, heart_rate, session_id } =
      req.body;

    const roomName = `session_${session_id}`;
    const io = getIO();

    const result = await knex("oximeter_readings").insert({
      patient_id,
      sp02,
      perfusion_index,
      heart_rate,
      session_id,
    });

    const socketData = {
      device_type: "App",
      notes: "update",
    };

    io.to(roomName).emit(
      "refreshOximeterData",
      JSON.stringify(socketData, null, 2),
    );

    const aminationData = {
      title: "oximeter",
      patientId: patient_id,
      sp02: sp02,
      perfusion_index: perfusion_index,
      heart_rate: heart_rate,
      sessionId: session_id,
    };

    console.log("[EPR Socket] Attempting to connect to wss://sockets.mxr.ai:5000");
    console.log("[EPR Socket] Payload:", JSON.stringify(aminationData, null, 2));

    const externalSocket = ioClient("wss://sockets.mxr.ai:5000", {
      transports: ["websocket"],
    });

    externalSocket.once("connect", () => {
      console.log("[EPR Socket] Connected. Socket ID:", externalSocket.id);
      externalSocket.emit("PlayAnimationEventEPR", JSON.stringify(aminationData, null, 2));
      console.log("[EPR Socket] Event 'PlayAnimationEventEPR' emitted.");
      externalSocket.disconnect();
    });

    externalSocket.on("connect_error", (err) => {
      console.error("[EPR Socket] Connection error:", err.message, err);
    });

    externalSocket.on("disconnect", (reason) => {
      console.log("[EPR Socket] Disconnected. Reason:", reason);
    });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Error while saving oximeter readings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.fetchSessionDetailData = async (req, res) => {
  const { session_id, userId } = req.body;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: "session_id is required",
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  const formatDateTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  try {
    const session = await knex("session").where({ id: session_id }).first();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const patientId = session.patient;
    const startTime = session.startTime ? new Date(session.startTime) : null;
    const endTime = session.endTime ? new Date(session.endTime) : new Date();

    const [patient, labRequests, notes, prescriptions, observations, conversationSessionIds] =
      await Promise.all([
        knex("patient_records").where({ id: patientId }).first(),

        knex("request_investigation")
          .where({ patient_id: patientId, session_id: session_id, request_by: userId })
          .select("test_name", "category", "status", "response_reason", "created_at")
          .orderBy("created_at", "desc"),

        knex("patient_notes")
          .where({ patient_id: patientId, doctor_id: userId })
          .modify((qb) => {
            if (startTime) qb.where("created_at", ">=", startTime);
            if (endTime) qb.where("created_at", "<=", endTime);
          })
          .select("content", "created_at")
          .orderBy("created_at", "desc"),

        knex("prescriptions")
          .where({ patient_id: patientId, doctor_id: userId })
          .modify((qb) => {
            if (startTime) qb.where("created_at", ">=", startTime);
            if (endTime) qb.where("created_at", "<=", endTime);
          })
          .select("medication_name", "created_at")
          .orderBy("created_at", "desc"),

        knex("observations")
          .where({ patient_id: patientId, observations_by: userId })
          .modify((qb) => {
            if (startTime) qb.where("created_at", ">=", startTime);
            if (endTime) qb.where("created_at", "<=", endTime);
          })
          .select("news2_score", "pulse", "created_at")
          .orderBy("created_at", "desc"),

        knex("conversation_sessions")
          .where({ session_id: session_id, patient_id: patientId, user_id: userId })
          .pluck("id"),
      ]);

    let aiChats = [];
    if (conversationSessionIds.length > 0) {
      const messages = await knex("conversation_messages")
        .whereIn("conversation_id", conversationSessionIds)
        .select("person", "query", "created_at")
        .orderBy("created_at", "asc");

      aiChats = messages.map((msg) => ({
        user: msg.person,
        message: msg.query,
        timestamp: formatDateTime(msg.created_at),
      }));
    }

    let participants = [];
    try {
      participants = JSON.parse(session.participants || "[]");
    } catch (_) {
      participants = [];
    }

    const userParticipant = participants.find((p) => String(p.id) === String(userId));
    const userParticipantList = userParticipant ? [userParticipant.name] : [];

    const formattedLabRequests = labRequests.map((lab) => ({
      test_name: lab.test_name,
      category: lab.category,
      status: lab.status,
      reason: lab.response_reason || null,
      timestamp: formatDateTime(lab.created_at),
    }));

    const formattedNotes = notes.map((note) => ({
      action: "CREATE",
      type: "Note",
      content: note.content,
      timestamp: formatDateTime(note.created_at),
    }));

    const formattedPrescriptions = prescriptions.map((presc) => ({
      action: "CREATE",
      type: "Prescription",
      content: presc.medication_name,
      timestamp: formatDateTime(presc.created_at),
    }));

    const formattedObservations = observations.map((obs) => ({
      action: "CREATE",
      type: "Observation",
      content: obs.pulse ? `Heart rate stable at ${obs.pulse} bpm.` : `NEWS2 score: ${obs.news2_score || "N/A"}`,
      timestamp: formatDateTime(obs.created_at),
    }));

    const totalActivities =
      formattedLabRequests.length +
      formattedNotes.length +
      formattedPrescriptions.length +
      formattedObservations.length +
      aiChats.length;

    return res.status(200).json({
      success: true,
      session_details: {
        id: String(session.id),
        title: session.name,
        type: "CLINICAL SESSION",
        participants_list: userParticipantList,
        duration: session.duration ? `${session.duration} mins` : null,
        started_at: formatDateTime(session.startTime),
        ended_at: formatDateTime(session.endTime),
        summary_counts: {
          participants: userParticipantList.length,
          notes: formattedNotes.length,
          prescriptions: formattedPrescriptions.length,
          observations: formattedObservations.length,
          labs: formattedLabRequests.length,
          ai_chats: aiChats.length,
        },
        patient_activity: {
          patient_name: patient ? patient.name : null,
          email: patient ? patient.email : null,
          total_activities: totalActivities,
          lab_requests: formattedLabRequests,
          notes: formattedNotes,
          prescriptions: formattedPrescriptions,
          observations: formattedObservations,
          ai_chats: aiChats,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching session detail data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// restcountries.com's v3.1 API is deprecated (returns an error body, no CORS
// headers) and its v5 replacement requires a paid API key. mledoze/countries
// is the same underlying open dataset restcountries.com used to wrap, served
// statically off GitHub's CDN with no auth/rate-limit; flagcdn.com fills in
// the flag image URLs it doesn't provide, keeping the response shape
// (name.common, cca2, idd.root/suffixes, flags.svg) identical to what the
// client already expects from the old restcountries.com response.
let countriesCache = null;
let countriesCacheAt = 0;
const COUNTRIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

exports.getCountries = async (req, res) => {
  try {
    const isFresh =
      countriesCache && Date.now() - countriesCacheAt < COUNTRIES_CACHE_TTL_MS;

    if (isFresh) {
      return res.status(200).json(countriesCache);
    }

    const response = await fetch(
      "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json",
    );

    if (!response.ok) {
      throw new Error(`countries dataset responded with ${response.status}`);
    }

    const rawCountries = await response.json();
    const data = rawCountries.map((country) => ({
      name: { common: country.name?.common },
      cca2: country.cca2,
      idd: country.idd,
      flags: {
        svg: `https://flagcdn.com/${country.cca2?.toLowerCase()}.svg`,
      },
    }));

    countriesCache = data;
    countriesCacheAt = Date.now();

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching countries list:", error);

    if (countriesCache) {
      return res.status(200).json(countriesCache);
    }

    res
      .status(502)
      .json({ success: false, message: "Failed to fetch countries list" });
  }
};

exports.getAIChatDataById = async (req, res) => {
  try {
    const { sessionId, userId } = req.query;

    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, message: "sessionId and userId are required" });
    }

    const conversationSessionIds = await knex("conversation_sessions")
      .where({ session_id: sessionId, user_id: userId })
      .pluck("id");

    if (conversationSessionIds.length === 0) {
      return res.status(200).json({ success: true, ai_chats: [] });
    }

    const messages = await knex("conversation_messages")
      .whereIn("conversation_id", conversationSessionIds)
      .select("id", "person", "query", "created_at")
      .orderBy("created_at", "asc");

    const ai_chats = messages.map((msg) => ({
      id: String(msg.id),
      sender: msg.person,
      message: msg.query,
      timestamp: msg.created_at,
    }));

    return res.status(200).json({ success: true, ai_chats });
  } catch (error) {
    console.error("Error fetching AI chat data:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

=======
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const sendMail = require("../helpers/mailHelper");
const ejs = require("ejs");
const fs = require("fs");
const { getIO } = require("../websocket");
const { secondaryApp } = require("../firebase");
const { uploadFile } = require("../services/S3_Services");
const path = require("path");

const VerificationEmail = fs.readFileSync(
  "./EmailTemplates/Verification.ejs",
  "utf8",
);

const compiledVerification = ejs.compile(VerificationEmail);

function getZoneColor(zoneName) {
  const zoneColors = {
    zone1: "#0ea5e9",
    zone2: "#5b21b6",
    zone3: "#fa812d",
    zone4: "#fad12c",
  };

  return zoneColors[zoneName] || null;
}

// login api and send otp on mail
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await knex("users").where({ uemail: email }).first();
    if (user) {
      const now = new Date();
      await knex("users").where({ uemail: email }).update({ lastLogin: now });
    }
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
      return res
        .status(200)
        .json({ message: "Email and password do not match" });
    }
    const orgName = await knex("organisations")
      .where({ id: user.organisation_id })
      .first();

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
        organisation_name: orgName.name,
      },
    });
  } catch (error) {
    console.error("Error in logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// send otp APi
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(200).json({ message: "Email is required" });
    }

    const user = await knex("users").where({ uemail: email }).first();

    if (!user) {
      return res.status(200).json({ message: "User not found" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await knex("users").where({ id: user.id }).update({
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
exports.verify = async (req, res) => {
  try {
    const { email, code, fcm_token } = req.body;

    // 1. Validate input
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    // 2. Fetch user by email
    const user = await knex("users").where({ uemail: email }).first();
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "User not found" });
    }

    // 3. Check if OTP matches
    if (user.verification_code?.toString() !== code.toString()) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid verification code" });
    }

    // 4. Check if OTP expired (15 minutes)
    const now = new Date();
    const codeGeneratedAt = new Date(user.updated_at);
    const expirationTime = new Date(codeGeneratedAt.getTime() + 15 * 60 * 1000);
    if (now > expirationTime) {
      return res
        .status(200)
        .json({ success: false, message: "Verification code has expired" });
    }

    // 5. Update user with FCM token, lastLogin, and clear verification code
    await knex("users").where({ uemail: email }).update({
      fcm_token,
      lastLogin: now,
      verification_code: null,
      updated_at: now,
    });

    // 6. Track last login in separate table
    const existingLogin = await knex("lastLogin")
      .where({ userId: user.id })
      .first();
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
exports.getAllPatients = async (req, res) => {
  try {
    const { userId, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const user = await knex("users").where({ id: userId }).first();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const assignedPatients = await knex("assign_patient")
      .where("user_id", userId)
      .pluck("patient_id");

    if (!assignedPatients.length) {
      return res.status(200).json({
        success: true,
        message: "No patients assigned to this user",
        totalPatients: 0,
        page: 1,
        totalPages: 1,
        perPage: 10,
        data: [],
      });
    }

    const [{ count }] = await knex("patient_records")
      .whereIn("id", assignedPatients)
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .count("id as count");

    const patients = await knex("patient_records")
      .select(
        "id",
        "name",
        "email",
        "phone",
        knex.raw("DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth"),
        "gender",
        "type",
        "category",
        "status",
      )
      .whereIn("id", assignedPatients)
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
    console.error("Error getting assigned patient records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// session list get by user id api
exports.getVirtualSessionByUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

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

// patient summary details api
exports.getPatientSummaryById = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res
        .status(400)
        .json({ success: false, message: "patientId is required" });
    }

    // Fetch patient data
    const patient = await knex("patient_records")
      .where({ id: patientId })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .first();

    if (!patient) {
      return res
        .status(200)
        .json({ success: false, message: "Patient not found" });
    }
    const calculateAge = (value) => {
      if (!value) return null;

      // If it's already a number (age)
      if (typeof value === "number" || !isNaN(value)) {
        return Number(value);
      }

      // If it's a date (DOB)
      const dob = new Date(value);
      if (isNaN(dob.getTime())) return null;

      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      return age;
    };

    // Structure the data into summary sections
    const summary = {
      ID: patient.id,
      "General Information": {
        Name: patient.name,
        Gender: patient.gender,
        Phone: patient.phone,
        Email: patient.email,
        Address: patient.address,
        Category: patient.category,
        Location: patient.scenario_location,
        "Room Type": patient.room_type,
      },
      "Clinical Information": {
        Height: patient.height,
        Weight: patient.weight,
        Age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : null,
        Ethnicity: patient.ethnicity,
        Nationality: patient.nationality,
        "Team Roles": patient.healthcare_team_roles,
        "Team Traits": patient.team_traits,
        "Patient Assessment": patient.patient_assessment,
      },
      "Social And Medical Background": {
        "Social Economic History": patient.social_economic_history,
        "Family Medical History": patient.family_medical_history,
        "Lifestyle And Home Situation": patient.lifestyle_and_home_situation,
      },
      "Equipment And Tests": {
        "Medical Equipment": patient.medical_equipment,
        Pharmaceuticals: patient.pharmaceuticals,
        "Diagnostic Equipment": patient.diagnostic_equipment,
        "Blood Tests": patient.blood_tests,
      },
      Observations: {
        "Initial Admission Observations":
          patient.initial_admission_observations,
        "Expected Observations":
          patient.expected_observations_for_acute_condition,
        "Recommended Observations During Event":
          patient.recommended_observations_during_event,
        "Observation Results Recovery": patient.observation_results_recovery,
        "Observation Results Deterioration":
          patient.observation_results_deterioration,
      },
      "Diagnosis And Treatment": {
        "Recommended Diagnostic Tests": patient.recommended_diagnostic_tests,
        "Treatment Algorithm": patient.treatment_algorithm,
        "Correct Treatment": patient.correct_treatment,
        "Expected Outcome": patient.expected_outcome,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching patient summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// patient note get by id Api
exports.getPatientNoteById = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }

    const notes = await knex("patient_notes")
      .where({ patient_id: patientId })
      .orderBy("created_at", "desc");

    if (notes.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const formattedNotes = notes.map((note) => ({
      ...note,
      created_at: note.created_at
        ? new Date(note.created_at)
            .toISOString()
            .replace("T", " ")
            .split(".")[0]
        : null,
      updated_at: note.updated_at
        ? new Date(note.updated_at)
            .toISOString()
            .replace("T", " ")
            .split(".")[0]
        : null,
    }));

    res.status(200).json({
      success: true,
      count: formattedNotes.length,
      data: formattedNotes,
    });
  } catch (error) {
    console.error("Error fetching patient notes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// patient note add and update Api
exports.addOrUpdatePatientNote = async (req, res) => {
  try {
    const {
      id,
      patient_id,
      doctor_id,
      organisation_id,
      title,
      content,
      report_id,
      sessionId,
      file,
    } = req.body;

    // Initial validation
    if (!patient_id || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "patient_id, title, and content are required",
      });
    }

    let noteId;
    let isNewNote = false;
    const userData = await knex("users").where({ id: doctor_id }).first();
    let attachment;
    let isNewAttachment = false;

    const isBase64 =
      typeof file === "string" &&
      file.length > 100 &&
      /^[A-Za-z0-9+/=\n\r]+$/.test(file.replace(/^data:[^;]+;base64,/, ""));

    if (isBase64) {
      console.log("📎 New attachment detected");

      let mimeType = "application/octet-stream";
      let base64Data = file;

      // Header present (web / some mobile SDKs)
      const headerMatch = file.match(/^data:([^;]+);base64,/);
      if (headerMatch) {
        mimeType = headerMatch[1];
        base64Data = file.replace(/^data:[^;]+;base64,/, "");
      }

      const buffer = Buffer.from(base64Data, "base64");

      console.log(`📦 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
      console.log(`🧾 File type: ${mimeType}`);

      if (buffer.length === 0) {
        throw new Error("Decoded file buffer is empty");
      }

      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds 10MB limit",
        });
      }

      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };

      const extension = mimeToExt[mimeType] || "bin";

      const originalName =
        req.body.file_name && req.body.file_name.trim()
          ? req.body.file_name
          : `upload_${Date.now()}.${extension}`;

      console.log(`📝 Saving as: ${originalName}`);

      const result = await uploadFile(
        {
          originalname: originalName,
          buffer,
          mimetype: mimeType,
        },
        "profiles",
      );

      attachment = result.Location;
      isNewAttachment = true;

      console.log("✅ Attachment uploaded:", attachment);
    } else {
      console.log("ℹ️ No valid base64 file provided");
    }
    if (id) {
      const updateData = {
        patient_id,
        doctor_id: doctor_id || null,
        organisation_id: organisation_id || null,
        title,
        content,
        report_id: report_id || null,
        updated_at: knex.fn.now(),
      };

      if (isNewAttachment && attachment) {
        updateData.attachments = attachment;
        console.log("🔄 Attachment updated in DB");
      } else {
        console.log("🔒 Keeping existing attachment");
      }

      const updated = await knex("patient_notes")
        .where({ id })
        .update(updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Note not found for update",
        });
      }
      noteId = id;
    } else {
      const [newNoteId] = await knex("patient_notes").insert({
        patient_id,
        doctor_id: doctor_id || null,
        organisation_id: organisation_id || null,
        title,
        content,
        attachments: attachment || null,
        report_id: report_id || null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });

      noteId = newNoteId;
      isNewNote = true;
    }

    let successMessage;

    if (noteId && sessionId && sessionId != 0) {
      const io = getIO();
      const roomName = `session_${sessionId}`;

      const notificationTitle = isNewNote ? "Note Added" : "Note Updated";
      const notificationBody = isNewNote
        ? `A New Note (${title}) Added by ${userData.username}`
        : `A Note (${title}) Updated by ${userData.username}`;
      io.to(roomName).emit("patientNotificationPopup", {
        roomName,
        title: notificationTitle,
        body: notificationBody,
        orgId: organisation_id,
        created_by: userData.username,
        patient_id: patient_id,
      });

      // io.to(roomName).emit("refreshPatientData");
      const socketData = {
        device_type: "App",
        notes: "update",
      };

      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2),
      );
      console.log("hitssssss");

      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: notificationTitle,
              body: `A note has been processed for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              noteId: String(noteId),
              type: "note_processed",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
            console.log(`✅ Notification sent to user ${user.id}`);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );

            const errorCode = notifErr.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              console.log(
                `Invalid FCM token for user ${user.id}. Removing from DB.`,
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_token: null });
            }
          }
        }
      }

      successMessage = isNewNote
        ? "Patient note added and notification sent successfully"
        : "Patient note updated and notification sent successfully";
    } else {
      successMessage = isNewNote
        ? "Patient note added successfully"
        : "Patient note updated successfully";
    }

    res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        id: noteId,
        patient_id,
        doctor_id,
        organisation_id,
        title,
        content,
        report_id: report_id || null,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error adding/updating patient note:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete note Api
exports.deleteNoteById = async (req, res) => {
  try {
    const { noteId, userId, sessionId } = req.body;

    if (!noteId) {
      return res
        .status(400)
        .json({ success: false, message: "Note ID is required." });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    // Fetch note from DB
    const note = await knex("patient_notes").where({ id: noteId }).first();
    const userData = await knex("users").where({ id: userId }).first();

    if (!note) {
      return res
        .status(404)
        .json({ success: false, message: "Note not found." });
    }

    // Check if doctor_id matches userId
    if (parseInt(note.doctor_id) !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this note.",
      });
    }

    // Delete note
    await knex("patient_notes").where("id", noteId).del();

    const socketData = {
      device_type: "App",
      notes: "update",
    };
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );
    console.log("delete hittt");

    const notificationTitle = "Note Deleted";
    const notificationBody = `A Note (${note.title}) Deleted by ${userData.username}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: notificationTitle,
      body: notificationBody,
      orgId: note.organisation_id,
      created_by: userData.username,
      patient_id: note.patient_id,
    });

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete note.",
    });
  }
};

// investigation test name api
exports.getAllCategoriesInvestigationsById_old = async (req, res) => {
  try {
    const investigations = await knex("investigation")
      .leftJoin("users", "users.id", "=", "investigation.addedBy")
      .select(
        "investigation.id",
        "investigation.category",
        "investigation.test_name",
      )
      .where("investigation.status", "active")
      .orderBy("investigation.category", "asc");

    if (investigations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active investigations found",
      });
    }

    const grouped = investigations.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item.id,
        test_name: item.test_name,
      });
      return acc;
    }, {});

    const formattedData = Object.keys(grouped).map((category) => ({
      category_name: category,
      items: grouped[category],
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching grouped investigations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllCategoriesInvestigationsById = async (req, res) => {
  try {
    const { patient_id } = req.query;
    1;
    const investigations = await knex("investigation")
      .leftJoin("users", "users.id", "=", "investigation.addedBy")
      .select(
        "investigation.id",
        "investigation.category",
        "investigation.test_name",
      )
      .where("investigation.status", "active")
      .orderBy("investigation.category", "asc");

    if (investigations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active investigations found",
      });
    }

    let pendingTests = [];
    if (patient_id) {
      const pending = await knex("request_investigation")
        .select("category", "test_name")
        .where("patient_id", patient_id)
        .andWhere("status", "pending");

      pendingTests = pending.map(
        (t) => `${t.category?.toLowerCase()}|${t.test_name?.toLowerCase()}`,
      );
    }

    const grouped = investigations.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];

      // Check if this test is in pendingTests
      const isRequested = pendingTests.includes(
        `${category.toLowerCase()}|${item.test_name.toLowerCase()}`,
      );

      acc[category].push({
        id: item.id,
        test_name: item.test_name,
        is_requested: isRequested,
      });

      return acc;
    }, {});

    const formattedData = Object.keys(grouped).map((category) => ({
      category_name: category,
      items: grouped[category],
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching grouped investigations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.saveRequestedInvestigations = async (req, res) => {
  const investigations = req.body;

  try {
    if (!Array.isArray(investigations) || investigations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of investigations.",
      });
    }

    const errors = [];
    const insertableInvestigations = [];
    let sessionID = 0;
    let organisationId = 0;
    let patientId = 0;
    let requestBy = 0;
    let device_type = null;
    let wardSessionId = 0;

    for (let i = 0; i < investigations.length; i++) {
      const item = investigations[i];

      if (
        !item.patient_id ||
        !item.request_by ||
        !item.category ||
        !item.test_name ||
        !item.organisation_id
      ) {
        errors.push(`Entry ${i + 1}: Missing required fields`);
        continue;
      }

      const sessionId = item.sessionId || 0;
      sessionID = item.sessionId;
      organisationId = item.organisation_id;
      patientId = item.patient_id;
      requestBy = item.request_by;
      device_type = item.device_type;
      wardSessionId = item.wardSessionId;

      const testNames = Array.isArray(item.test_name)
        ? item.test_name
        : [item.test_name];

      for (let j = 0; j < testNames.length; j++) {
        const testName = testNames[j]?.trim();

        if (!testName) continue;

        const existing = await knex("request_investigation")
          .where({
            patient_id: item.patient_id,
            test_name: testName,
            status: "pending",
            organisation_id: item.organisation_id,
            session_id: sessionId,
          })
          .first();

        if (existing) {
          errors.push(`${testName} already requested`);
          continue;
        }

        insertableInvestigations.push({
          patient_id: item.patient_id,
          request_by: item.request_by,
          category: item.category,
          test_name: testName,
          status: "pending",
          organisation_id: item.organisation_id,
          session_id: sessionId,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    if (insertableInvestigations.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No investigations inserted (duplicates or missing fields).",
        insertedCount: 0,
        warnings: errors,
      });
    }
    const insertedTestNames = insertableInvestigations.map(
      (inv) => inv.test_name,
    );

    const existingRequests = await knex("request_investigation")
      .where("patient_id", patientId)
      .where("status", "!=", "complete")
      .whereIn("test_name", insertedTestNames)
      .select("test_name");

    const existingTestNames = existingRequests.map((r) => r.test_name);

    const pantientDetails = await knex("patient_records")
      .where("id", patientId)
      .first();

    const newRequests = insertedTestNames.filter(
      (item) => !existingTestNames.includes(item.test_name),
    );

    await knex("request_investigation").insert(insertableInvestigations);

    const socketData = {
      device_type: "App",
      request_investigation: "update",
    };
    const io = getIO();
    const roomName = `session_${sessionID}`;

    const payload = {
      roomName,
      title: notificationTitle,
      body: notificationBody,
      orgId: organisationId,
      created_by: userdetail.username,
      patient_id: patientId,
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );
    if (device_type == "App") {
      const approom = `org_${organisationId}`;
      const userdetail = await knex("users").where({ id: requestBy }).first();
      const notificationTitle = "New Investigation Request Recieved";
      const notificationBody = `A New Investigation Request Recieved by ${userdetail.username}`;
      io.to(approom).emit("virtualNotificationPopup", payload);
    } else {
      console.log("Payyyyyyyyyyyload sessssssssssion", payload);
      const userdetail = await knex("users").where({ id: requestBy }).first();
      const notificationTitle = "New Investigation Request Added";
      const notificationBody = `A New Investigation Request Added by ${userdetail.username}`;
      io.to(roomName).emit("patientNotificationPopup", payload);
      if (wardSessionId && wardSessionId != 0 && wardSessionId != null) {
        console.log("Payyyyyyyyyyyload waaaaaaaaaard", payload);
        io.to(`ward_session_${wardSessionId}_supervisors`).emit(
          "patientNotificationPopup",
          payload,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Investigations saved successfully",
      insertedCount: insertableInvestigations.length,
      warnings: errors,
    });
  } catch (error) {
    console.error("Error saving investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save investigations",
      error: error.message,
    });
  }
};

exports.getInvestigationsReportById = async (req, res) => {
  const { patientId, orgId } = req.query;

  try {
    if (!patientId || !orgId) {
      return res.status(400).json({
        success: false,
        message: "patientId and orgId are required.",
      });
    }

    const completedInvestigations = await knex("request_investigation as ri")
      .leftJoin("category as c", "ri.category", "c.name")
      .leftJoin("categorytest as inv", function () {
        this.on("inv.category", "=", "c.id").andOn(
          "ri.test_name",
          "=",
          "inv.name",
        );
      })
      .where({
        "ri.patient_id": patientId,
        "ri.organisation_id": orgId,
        "ri.status": "complete",
      })
      .select(
        "ri.id as request_id",
        "ri.category",
        "ri.test_name",
        "inv.id as investigation_id",
      )
      .orderBy("ri.created_at", "desc");

    // ✅ Group by category + test_name (remove duplicates)
    const groupedInvestigations = Object.values(
      completedInvestigations.reduce((acc, row) => {
        const key = `${row.category}-${row.test_name}`;
        if (!acc[key]) {
          acc[key] = {
            investigation_id: row.investigation_id || null,
            category: row.category,
            test_name: row.test_name,
            request_ids: [],
          };
        }
        acc[key].request_ids.push(row.request_id);
        return acc;
      }, {}),
    );

    // ✅ Return response
    res.status(200).json({
      success: true,
      message: "List fetched successfully.",
      count: groupedInvestigations.length,
      data: groupedInvestigations,
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

// all investigation resquest report Api
exports.getInvestigationReportData = async (req, res) => {
  const { patientId, reportId } = req.query;
  try {
    if (!patientId || !reportId) {
      return res.status(400).json({
        success: false,
        message: "patientId and reportId are required.",
      });
    }

    const reports = await knex("investigation_reports as ir")
      .join("patient_records as pr", "ir.patient_id", "pr.id")
      .leftJoin("investigation as inv", "ir.investigation_id", "inv.id")
      .leftJoin("testparameters as tp", function () {
        this.on("ir.parameter_id", "=", "tp.id").andOn(
          "ir.investigation_id",
          "=",
          "tp.investigation_id",
        );
      })
      .leftJoin("users as u", "ir.submitted_by", "u.id")
      .leftJoin(
        "request_investigation as req",
        "ir.request_investigation_id",
        "req.id",
      )
      .where("ir.patient_id", patientId)
      .andWhere("ir.investigation_id", reportId)
      .andWhere(function () {
        this.whereNull("pr.deleted_at").orWhere("pr.deleted_at", "");
      })
      .select(
        "inv.id as investigation_id",
        "req.id as request_id",
        "req.category",
        "req.test_name",
        "ir.id as report_id",
        "ir.request_investigation_id as request_investigation_id",
        "tp.name as parameter",
        "tp.units",
        "tp.field_type",
        "tp.normal_range",
        "ir.value",
        "ir.scheduled_date",
        "ir.created_at as date",
        "u.fname as user_fname",
        "u.lname as user_lname",
      )
      .orderBy("ir.created_at", "desc");

    // ✅ Fetch notes
    const notes = await knex("patient_notes as pn")
      .leftJoin("users as du", "pn.doctor_id", "du.id")
      .where("pn.patient_id", patientId)
      .andWhere("pn.report_id", reportId)
      .select(
        "pn.id",
        "pn.title",
        "pn.content",
        "pn.created_at",
        "du.fname as doctor_fname",
        "du.lname as doctor_lname",
      )
      .orderBy("pn.created_at", "desc");

    // ✅ No data found
    if (!reports.length && !notes.length) {
      return res.status(200).json({
        success: false,
        message: "No reports or notes found for this patient and report ID.",
      });
    }

    // ✅ Group results
    const groupedData = [];
    const groupedByTest = reports.reduce((acc, row) => {
      const key = `${row.category || "Unknown"}-${row.test_name || "Unknown"}`;
      if (!acc[key]) {
        acc[key] = {
          id: row.investigation_id,
          category: row.category,
          test_name: row.test_name,
          results: {},
        };
      }

      const testGroup = acc[key];
      const parameterName = row.parameter || `Parameter ${row.report_id}`;

      if (!testGroup.results[parameterName]) {
        testGroup.results[parameterName] = {
          parameter: parameterName,
          values: [],
          units: row.units || null,
          normal_range: row.normal_range || null,
          field_type: row.field_type || null,
        };
      }

      testGroup.results[parameterName].values.push({
        date: row.date
          ? new Date(row.date).toLocaleString("sv-SE").replace("T", " ")
          : null,
        scheduled_date: (() => {
          if (!row.scheduled_date) return null;

          const scheduled = new Date(row.scheduled_date);
          const now = new Date();
          const scheduledDateOnly = new Date(
            scheduled.toISOString().split("T")[0],
          );
          const todayDateOnly = new Date(now.toISOString().split("T")[0]);

          return scheduledDateOnly > todayDateOnly
            ? scheduled.toLocaleString("sv-SE").replace("T", " ")
            : null;
        })(),
        request_investigation_id: row.request_investigation_id,
        value: row.value,
        person_name:
          row.user_fname || row.user_lname
            ? `${row.user_fname || ""} ${row.user_lname || ""}`.trim()
            : null,
      });

      return acc;
    }, {});

    for (const key in groupedByTest) {
      const test = groupedByTest[key];
      test.results = Object.values(test.results);
      groupedData.push(test);
    }

    // ✅ Final response
    res.status(200).json({
      success: true,
      message: "Investigation report data fetched successfully.",
      count: groupedData.length,
      data: groupedData,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        created_at: new Date(n.created_at)
          .toLocaleString("sv-SE")
          .replace("T", " "),
        doctor_name:
          n.doctor_fname || n.doctor_lname
            ? `${n.doctor_fname || ""} ${n.doctor_lname || ""}`.trim()
            : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching investigation reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching investigation reports.",
    });
  }
};

// get all patient prescription data
exports.getPrescriptionsDataById = async (req, res) => {
  const { patientId } = req.query;

  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const prescriptions = await knex("prescriptions as p")
      .select(
        "p.id",
        "p.patient_id",
        "p.doctor_id",
        "p.medication_name",
        "p.indication",
        "p.description",
        "p.start_date",
        "p.days_given",
        "p.administration_time",
        "p.dose",
        "p.DrugGroup as drug_group",
        "p.DrugSubGroup as drug_sub_group",
        "p.TypeofDrug as type_of_drug",
        "p.route",
        "p.Way as way",
        "p.Duration as duration",
        "p.Unit as unit",
        "p.Frequency as frequency",
        "p.Instructions as instruction",
        "u.fname as doctor_fname",
        "u.lname as doctor_lname",
      )
      .leftJoin("users as u", "p.doctor_id", "u.id")
      .where("p.patient_id", patientId)
      .orderBy("p.created_at", "desc");

    const formattedData = prescriptions.map((item) => ({
      ...item,
      start_date: item.start_date
        ? new Date(item.start_date).toISOString().split("T")[0]
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Prescriptions fetched successfully.",
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching prescriptions by patient ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions.",
    });
  }
};

// get all medician list with dose Api
// exports.getAllMedicationsList = async (req, res) => {
//   try {
//     const medications = await knex("medications_list").select(
//       "id",
//       "medication",
//       "dose",
//     );

//     // const normalized = medications.map((m) => ({
//     //   ...m,
//     //   dose: JSON.parse(m.dose),
//     // }));

//     res.status(200).json({
//       success: true,
//       data: medications,
//     });
//   } catch (error) {
//     console.error("Error fetching medications:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// add Prescription api
exports.addPrescriptionApi = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      organisation_id,
      description,
      medication_name,
      indication,
      dose,
      route,
      start_date,
      days_given,
      administration_time,
      sessionId,
      prescription_record_id,
      drug_group,
      drug_sub_group,
      type_of_drug,
      unit,
      way,
      frequency,
      instructions,
      duration,
    } = req.body;

    if (
      !patient_id ||
      !doctor_id ||
      !organisation_id ||
      !medication_name ||
      !dose ||
      !route ||
      !start_date ||
      !administration_time ||
      !drug_group ||
      !drug_sub_group ||
      !type_of_drug ||
      !unit ||
      !way ||
      !frequency ||
      !instructions ||
      !duration
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    let id;
    if (prescription_record_id) {
      await knex("prescriptions").where({ id: prescription_record_id }).update({
        patient_id,
        doctor_id,
        organisation_id,
        description,
        medication_name,
        indication,
        dose,
        route,
        DrugGroup: drug_group,
        DrugSubGroup: drug_sub_group,
        TypeofDrug: type_of_drug,
        Unit: unit,
        Way: way,
        Frequency: frequency,
        Instructions: instructions,
        Duration: duration,
        start_date,
        days_given,
        administration_time,
        updated_at: new Date(),
      });
      id = prescription_record_id;
    } else {
      const insertedIds = await knex("prescriptions").insert({
        patient_id,
        doctor_id,
        organisation_id,
        description,
        medication_name,
        indication,
        dose,
        route,
        DrugGroup: drug_group,
        DrugSubGroup: drug_sub_group,
        TypeofDrug: type_of_drug,
        Unit: unit,
        Way: way,
        Frequency: frequency,
        Instructions: instructions,
        Duration: duration,
        start_date,
        days_given,
        administration_time,
        created_at: new Date(),
        updated_at: new Date(),
      });
      id = insertedIds[0];
    }

    const userData = await knex("users").where({ id: doctor_id }).first();
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: prescription_record_id
        ? "Prescription Updated"
        : "Prescription Added",
      body: prescription_record_id
        ? `A New Prescription is updated by ${userData.username}`
        : `A New Prescription is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    console.log("prescriptions hittt");

    if (prescription_record_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: prescription_record_id
                ? "New Prescription Updated"
                : "New Prescription Added",
              body: prescription_record_id
                ? `A new Prescription has been updated for patient ${patient_id}.`
                : `A new Prescription has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              id: String(prescription_record_id),
              type: prescription_record_id
                ? "prescription_updated"
                : "prescription_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      prescription_record_id,
      message: prescription_record_id
        ? "Prescription updated successfully"
        : "Prescription added successfully",
    });
  } catch (error) {
    console.error("Error adding prescription:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.savefcmToken = async (req, res) => {
  try {
    const { fcmToken, userId } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ msg: "FCM Token not provided." });
    }

    const user = await knex("users").where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    await knex("users").where({ id: userId }).update({ fcm_token: fcmToken });

    res.status(200).json({ msg: "FCM token saved successfully." });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// exports.getActiveSessionsList = async (req, res) => {
//   const { userId } = req.params;

//   if (!userId) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid user ID",
//     });
//   }

//   try {
//     const assignedPatients = await knex("assign_patient")
//       .where("user_id", userId)
//       .pluck("patient_id");

//     if (assignedPatients.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No assigned patients found",
//         data: [],
//       });
//     }

//     const activeSessions = await knex("session as s")
//       .join("users as u", "s.createdBy", "u.id")
//       .join("patient_records as p", "s.patient", "p.id")
//       .select(
//         "s.id",
//         "s.name as session_name",
//         knex.raw("CONCAT(u.fname, ' ', u.lname) as started_by"),
//         "p.name as patient_name",
//         "s.startTime",
//         knex.raw(
//           "DATE_ADD(s.startTime, INTERVAL s.duration MINUTE) as end_time",
//         ),
//         "s.patient as patient_id",
//         "s.state",
//         "s.duration",
//         knex.raw("NOW() as `current_time`"),
//       )
//       .where("s.state", "active")
//       .whereIn("s.patient", assignedPatients)
//       .orderBy("s.startTime", "desc");

//     const io = getIO();
//     const userLimit = 3;

//     const sessionsWithSlotData = await Promise.all(
//       activeSessions.map(async (session) => {
//         const sessionRoom = `session_${session.id}`;
//         let userCount = 0;

//         try {
//           const socketsInRoom = await io.in(sessionRoom).fetchSockets();
//           const usersInSession = socketsInRoom.filter(
//             (sock) => sock.user && sock.user.role.toLowerCase() === "user",
//           );

//           userCount = usersInSession.length;
//         } catch (e) {
//           console.error(
//             `[API] Error fetching sockets for room ${sessionRoom}:`,
//             e,
//           );
//           userCount = 0;
//         }

//         const availableSlots = Math.max(0, userLimit - userCount);
//         const isSlotAvailable = availableSlots > 0;

//         return {
//           ...session,
//           userCount,
//           availableSlots,
//           isSlotAvailable,
//         };
//       }),
//     );

//     // ✅ Add two dummy sessions with isSlotAvailable = false
//     const dummySessions = [
//       {
//         id: 9001,
//         session_name: "Cardio Checkup - Dummy 1",
//         started_by: "Sophia Brown",
//         patient_name: "Rahul Mehta",
//         startTime: "2025-11-07 09:00:00.000",
//         end_time: "2025-11-07 09:30:00.000",
//         patient_id: "271",
//         state: "active",
//         duration: "30",
//         current_time: new Date().toISOString(),
//         userCount: 3,
//         availableSlots: 0,
//         isSlotAvailable: false,
//       },
//       {
//         id: 9002,
//         session_name: "Neuro Observation - Dummy 2",
//         started_by: "Liam Johnson",
//         patient_name: "Meera Nair",
//         startTime: "2025-11-07 09:40:00.000",
//         end_time: "2025-11-07 10:10:00.000",
//         patient_id: "272",
//         state: "active",
//         duration: "30",
//         current_time: new Date().toISOString(),
//         userCount: 3,
//         availableSlots: 0,
//         isSlotAvailable: false,
//       },
//     ];

//     // ✅ Combine real and dummy sessions
//     const combinedData = [...sessionsWithSlotData];

//     return res.status(200).json({
//       success: true,
//       message: "Active sessions fetched successfully",
//       data: combinedData,
//     });
//   } catch (error) {
//     console.error("Error fetching active sessions:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// profile  update api
// exports.updateProfileApi = async (req, res) => {
//   try {
//     const { id, fname, lname, thumbnail } = req.body;

//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "id are required.",
//       });
//     }

//     const existingUser = await knex("users").where("id", id).first();
//     if (!existingUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     const updateData = {
//       fname,
//       lname,
//       updated_at: new Date(),
//     };

//     if (thumbnail) {
//       updateData.user_thumbnail = thumbnail;
//     }

//     await knex("users").where("id", id).update(updateData);

//     return res.status(200).json({
//       success: true,
//       message: "User profile updated successfully.",
//     });
//   } catch (error) {
//     console.error("Error updating user:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

exports.getActiveSessionsList = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  try {
    // ✅ Run base queries in parallel
    const [userData, assignedPatients] = await Promise.all([
      knex("users").where({ id: userId }).first(),
      knex("assign_patient").where("user_id", userId).pluck("patient_id"),
    ]);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const io = getIO();
    const userLimit = 3;

    // =============================
    // 1️⃣ ACTIVE NORMAL SESSIONS
    // =============================
    const activeSessions = await knex("session as s")
      .join("users as u", "s.createdBy", "u.id")
      .join("patient_records as p", "s.patient", "p.id")
      .select(
        "s.id",
        "s.name as session_name",
        knex.raw("CONCAT(u.fname, ' ', u.lname) as started_by"),
        "p.name as patient_name",
        "s.startTime",
        knex.raw(
          "DATE_ADD(s.startTime, INTERVAL s.duration MINUTE) as end_time",
        ),
        "s.patient as patient_id",
        "s.state",
        "s.duration",
        knex.raw("NOW() as `current_time`"),
      )
      .where("s.state", "active")
      .whereIn("s.patient", assignedPatients || [])
      .orderBy("s.startTime", "desc");

    const sessionsWithSlotData = await Promise.all(
      activeSessions.map(async (session) => {
        const sessionRoom = `session_${session.id}`;
        let userCount = 0;

        try {
          const sockets = await io.in(sessionRoom).fetchSockets();
          userCount = sockets.filter(
            (s) => s.user?.role?.toLowerCase() === "user",
          ).length;
        } catch (e) {
          console.error(`Socket error in ${sessionRoom}`, e);
        }

        const availableSlots = Math.max(0, userLimit - userCount);

        return {
          ...session,
          userCount,
          availableSlots,
          isSlotAvailable: availableSlots > 0,
          type: "session",
        };
      }),
    );

    // =============================
    // 2️⃣ WARD ZONE DATA (OPTIMIZED)
    // =============================

    const wardSessions = await knex("wardsession")
      .leftJoin(
        "wards",
        "wards.id",
        "=",
        knex.raw("CONVERT(wardsession.ward_id, UNSIGNED)"),
      )
      .where("wards.orgId", userData.organisation_id)
      .where("wardsession.status", "ACTIVE");

    let zonePatientMap = []; // collect zone + patient ids

    for (const session of wardSessions) {
      if (!session.assignments || !session.users) continue;

      let usersArray;
      try {
        usersArray = JSON.parse(session.users);
      } catch {
        continue;
      }

      if (!usersArray.includes(Number(userId))) continue;

      let assignments;
      try {
        assignments = JSON.parse(session.assignments);
      } catch {
        continue;
      }

      for (let key in assignments) {
        if (
          key.startsWith("zone") &&
          Number(assignments[key].userId) === Number(userId)
        ) {
          const patientIds = assignments[key].patientIds || [];

          const startTime = session.start_time;
          const duration = session.duration;

          let endTime = null;

          if (startTime && duration) {
            const start = new Date(startTime);
            const end = new Date(start.getTime() + duration * 60000);
            endTime = end;
          }

          patientIds.forEach((pid) => {
            zonePatientMap.push({
              ward_name: session.name,
              zone_name: key,
              patient_id: pid,
              start_time: startTime,
              duration: duration,
              end_time: endTime,
            });
          });
        }
      }
    }

    // ✅ Fetch ALL patients in ONE query
    const uniquePatientIds = [
      ...new Set(zonePatientMap.map((z) => z.patient_id)),
    ];

    const patients = uniquePatientIds.length
      ? await knex("patient_records")
          .whereIn("id", uniquePatientIds)
          .select("id", "name")
      : [];

    const patientLookup = {};
    patients.forEach((p) => {
      patientLookup[p.id] = p.name;
    });

    const userZoneData = zonePatientMap.map((z) => ({
      id: String(z.patient_id),
      type: "ward",
      color_code: getZoneColor(z.zone_name),
      session_name: z.ward_name,
      patient_id: String(z.patient_id),
      patient_name: patientLookup[z.patient_id] || null,
      start_time: z.start_time
        ? new Date(z.start_time).toISOString().slice(0, 19).replace("T", " ")
        : null,

      end_time: z.end_time
        ? new Date(z.end_time).toISOString().slice(0, 19).replace("T", " ")
        : null,

      duration: z.duration,
      isSlotAvailable: true,
    }));

    // =============================
    // 3️⃣ FINAL RESPONSE
    // =============================

    const combinedData = [...sessionsWithSlotData, ...userZoneData];

    return res.status(200).json({
      success: true,
      message: "Active sessions fetched successfully",
      data: combinedData,
    });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.updateProfileApi = async (req, res) => {
  try {
    const { id, fname, lname, user_thumbnail } = req.body;

    if (!id) {
      console.warn("⚠️ Missing user id");
      return res.status(400).json({
        success: false,
        message: "id is required.",
      });
    }
    const updateData = {
      fname,
      lname,
      updated_at: new Date(),
    };

    if (user_thumbnail) {
      const base64Data = user_thumbnail.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      // if (buffer.length > 5 * 1024 * 1024) {
      //   console.warn("⚠️ Image exceeds 5MB limit");
      //   return res.status(400).json({
      //     success: false,
      //     message: "Image size too large",
      //   });
      // }

      const mimeTypeMatch = user_thumbnail.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
      const extension = mimeType.split("/")[1] || "jpg";
      const result = await uploadFile(
        {
          originalname: `profile_${id}.${extension}`,
          buffer,
          mimetype: mimeType,
        },
        "profiles",
        id,
      );
      updateData.user_thumbnail = result.Location;
    } else {
      console.log("ℹ️ No thumbnail provided, skipping image upload");
    }

    await knex("users").where("id", id).update(updateData);
    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    console.error("🔥 updateProfileApi error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.deleteToken = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }
    await knex("users").where({ id: userId }).update({ fcm_token: null });
    res
      .status(200)
      .json({ success: true, message: "FCM token deleted successfully" });
  } catch (error) {
    console.log("Error deleting FCM token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getObservationsDataById = async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const observations = await knex("observations")
      .leftJoin("users", "users.id", "observations.observations_by")
      .where({ patient_id: patientId })
      .select(
        "users.username as recorded_by",
        "observations.id",
        "observations.respiratory_rate",
        "observations.o2_sats",
        "observations.time_stamp as timestamp",
        "observations.oxygen_delivery",
        "observations.blood_pressure",
        "observations.pulse",
        "observations.consciousness as gcs",
        "observations.temperature",
        "observations.news2_score",
        "observations.pews2",
        "observations.mews2",
        "observations.created_at",
      )
      .orderBy("observations.created_at", "desc");

    return res.status(200).json({
      success: true,
      data: observations,
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.getOxygenDeliveryOptions = async (req, res) => {
  try {
    const OxygenDelivery = [
      "Room Air",
      "Nasal Cannula",
      "Simple Face Mask",
      "Venturi Mask",
      "Non-Rebreather Mask",
      "Partial Rebreather Mask",
      "High-Flow-Nasal Cannula (HFNC)",
      "CPAP",
      "BiPAP",
      "Mechanical Ventilation",
    ];

    return res.status(200).json(OxygenDelivery);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.addNewObservation = async (req, res) => {
  try {
    const {
      patient_id,
      recorded_by,
      timeStamp,
      respiratory_rate,
      o2_sats,
      oxygen_delivery,
      blood_pressure,
      pulse,
      gcs,
      temperature,
      news2Score,
      mews2,
      pews2,
      sessionId,
      observation_record_id,
    } = req.body;

    if (
      !patient_id ||
      !recorded_by ||
      !timeStamp ||
      !respiratory_rate ||
      !o2_sats ||
      !oxygen_delivery ||
      !blood_pressure ||
      !gcs ||
      !temperature ||
      !news2Score ||
      !mews2 ||
      !pews2 ||
      !pulse
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: recorded_by }).first();
    let id;

    if (observation_record_id) {
      await knex("observations").where({ id: observation_record_id }).update({
        patient_id,
        respiratory_rate,
        o2_sats,
        oxygen_delivery,
        blood_pressure,
        time_stamp: timeStamp,
        consciousness: gcs,
        temperature,
        news2_score: news2Score,
        pews2,
        mews2,
        pulse,
        organisation_id: userData.organisation_id,
        updated_at: new Date(),
      });

      // use existing id
      id = observation_record_id;
    } else {
      // insert returns array
      const insertedIds = await knex("observations").insert({
        patient_id,
        observations_by: recorded_by,
        respiratory_rate,
        o2_sats,
        oxygen_delivery,
        blood_pressure,
        time_stamp: timeStamp,
        consciousness: gcs,
        temperature,
        news2_score: news2Score,
        pews2,
        mews2,
        pulse,
        organisation_id: userData.organisation_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      id = insertedIds[0];
    }

    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: observation_record_id
        ? "Observation Updated"
        : "Observation Added",
      body: observation_record_id
        ? `A New Observation is updated by ${userData.username}`
        : `A New Observation is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      observations: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    if (id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: observation_record_id
                ? "Observation Updated"
                : "New Observation Added",
              body: observation_record_id
                ? `A new Observation has been updated for patient ${patient_id}.`
                : `A new Observation has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              id: String(id),
              type: observation_record_id
                ? "observation_updated"
                : "observation_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      id,
      message: observation_record_id
        ? "Observation Updated successfully"
        : "Observation added successfully",
    });
  } catch (error) {
    console.error("Error adding Observation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteObservationById = async (req, res) => {
  try {
    const { patient_id, sessionId, observationId, userId } = req.body;

    if (!observationId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: userId }).first();

    await knex("observations").where({ id: observationId }).delete();

    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Observation Deleted",
      body: `A Observation is Deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      observations: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    if (sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Observation Deleted",
              body: `A Observation has been Deleted for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              type: "observation_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Observation Deleted successfully",
    });
  } catch (error) {
    console.error("Error Deleted Observation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getFluidRecords = async (req, res) => {
  const { patientId } = req.params;

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const fluid_balance = await knex("fluid_balance")
      .leftJoin("users", "users.id", "fluid_balance.observations_by")
      .where({ patient_id: patientId })
      .select(
        "users.username as recorded_by",
        "fluid_balance.id",
        "fluid_balance.fluid_intake as type",
        "fluid_balance.type as subType",
        "fluid_balance.units",
        "fluid_balance.duration",
        "fluid_balance.route",
        "fluid_balance.timestamp",
        "fluid_balance.notes",
        "fluid_balance.created_at",
      )
      .orderBy("fluid_balance.created_at", "desc");

    return res.status(200).json(fluid_balance);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.getSubTypeOptions = async (req, res) => {
  try {
    const OxygenDelivery = [
      "Oral",
      "IV",
      "Colloid",
      "Blood Product",
      "NG",
      "PEG",
      "Urine",
      "Stool",
      "Emesis",
      "Drain",
      "Insensible Estimate",
    ];

    return res.status(200).json(OxygenDelivery);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list investigations.",
    });
  }
};

exports.addFluidRecord = async (req, res) => {
  try {
    const {
      patient_id,
      recorded_by,
      type,
      sub_type,
      volume,
      rate_duration,
      route_site,
      timestamp,
      notes,
      sessionId,
      fluid_record_id,
    } = req.body;

    if (
      !patient_id ||
      !recorded_by ||
      !type ||
      !sub_type ||
      !volume ||
      !rate_duration ||
      !route_site ||
      !timestamp
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: recorded_by }).first();
    let id;
    if (fluid_record_id) {
      await knex("fluid_balance").where({ id: fluid_record_id }).update({
        patient_id,
        observations_by: recorded_by,
        fluid_intake: type,
        type: sub_type,
        units: volume,
        duration: rate_duration,
        route: route_site,
        timestamp,
        notes,
        organisation_id: userData.organisation_id,
        updated_at: new Date(),
      });

      id = fluid_record_id;
    } else {
      const insertedIds = await knex("fluid_balance").insert({
        patient_id,
        observations_by: recorded_by,
        fluid_intake: type,
        type: sub_type,
        units: volume,
        duration: rate_duration,
        route: route_site,
        timestamp,
        notes,
        organisation_id: userData.organisation_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      id = insertedIds[0];
    }
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: fluid_record_id ? "Fluid Balance Updated" : "Fluid Balance Added",
      body: fluid_record_id
        ? `A New Fluid Balance is updated by ${userData.username}`
        : `A New Fluid Balance is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patient_id,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      fluid_balance: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    if (id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: fluid_record_id
                ? "New Fluid Balance Updated"
                : "New Fluid Balance Added",
              body: fluid_record_id
                ? `A new Fluid Balance has been updated for patient ${patient_id}.`
                : `A new Fluid Balance has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patient_id),
              id: String(id),
              type: fluid_record_id
                ? "fluid_balance_updated"
                : "fluid_balance_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      id,
      message: fluid_record_id
        ? "Fluid Balance updated successfully"
        : "Fluid Balance added successfully",
    });
  } catch (error) {
    console.error("Error adding Fluid Balance:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteFluidBalanceById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, fluidBalanceId } = req.body;

    if (!fluidBalanceId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: userId }).first();

    await knex("fluid_balance").where({ id: fluidBalanceId }).delete();

    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Fluid Balance Deleted",
      body: `A Fluid Balance is deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      fluid_balance: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    if (fluidBalanceId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Fluid Balance deleted",
              body: `A Fluid Balance has been deleted for patient ${patientId}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(fluidBalanceId),
              type: "fluid_balance_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      fluidBalanceId,
      message: "Fluid Balance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted Fluid Balance:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deletePrescriptionById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, prescriptionId } = req.body;

    if (!prescriptionId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await knex("prescriptions").where({ id: prescriptionId }).delete();

    const userData = await knex("users").where({ id: userId }).first();
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Prescription Deleted",
      body: `A Prescription is deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    console.log("prescriptions hittt");

    if (prescriptionId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Prescription Deleted",
              body: `A Prescription has been deleted for patient ${patientId}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(prescriptionId),
              type: "prescription_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      prescriptionId,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted prescription:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateInvestigationReportValues = async (req, res) => {
  const {
    reportId,
    userId,
    sessionId,
    patient_id,
    values = {},
    files = {},
    files_type = {},
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      error: "Invalid request. userId are required.",
    });
  }
  const io = getIO();
  try {
    const user = await knex("users")
      .select("organisation_id")
      .where("id", userId)
      .first();

    if (!user) {
      return res.status(400).json({
        error: `User with ID ${userId} not found.`,
      });
    }

    /* ---------------- HELPERS ---------------- */

    const isUrl = (val) => typeof val === "string" && /^https?:\/\//i.test(val);

    const isBase64 = (val) =>
      typeof val === "string" &&
      val.length > 100 &&
      /^[A-Za-z0-9+/=\n\r]+$/.test(val.replace(/^data:[^;]+;base64,/, ""));

    const uploadBase64ToS3 = async (base64, paramName, originalFileName) => {
      let mimeType = "application/octet-stream";
      let base64Data = base64;

      const headerMatch = base64.match(/^data:([^;]+);base64,/);
      if (headerMatch) {
        mimeType = headerMatch[1];
        base64Data = base64.replace(/^data:[^;]+;base64,/, "");
      }

      const buffer = Buffer.from(base64Data, "base64");

      if (!buffer.length) throw new Error("Empty file buffer");

      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB");
      }

      const safeName = originalFileName
        ? path
            .basename(originalFileName)
            .replace(/\s+/g, "_")
            .replace(/[^\w.-]/g, "")
        : `${paramName}_${Date.now()}`;

      const extension = path.extname(safeName) || "";

      const finalFileName = extension
        ? `${path.basename(safeName, extension)}_${Date.now()}${extension}`
        : `${safeName}_${Date.now()}`;

      const result = await uploadFile(
        {
          originalname: finalFileName,
          buffer,
          mimetype: mimeType,
        },
        "profiles",
      );

      return result.Location;
    };

    /* -------- FETCH EXISTING REPORT VALUES -------- */

    const oldReports = await knex("investigation_reports")
      .join(
        "testparameters",
        "testparameters.id",
        "investigation_reports.parameter_id",
      )
      .where({ request_investigation_id: reportId })
      .select(
        "testparameters.name",
        "investigation_reports.value",
        "investigation_reports.patient_id",
      );

    /* -------- UPDATE LOOP -------- */

    for (const report of oldReports) {
      const { name, value: oldValue } = report;
      let newValue = null;
      if (isUrl(oldValue) && files[name]) {
        const file = files[name];
        const fileNameFromClient = files_type[name];
        if (
          typeof file === "string" &&
          (file.startsWith("data:") || file.length > 200)
        ) {
          console.log(`📎 Uploading file for: ${name}`);
          newValue = await uploadBase64ToS3(file, name, fileNameFromClient);
        }
      } else if (!isUrl(oldValue) && values[name] !== undefined) {
        newValue = values[name];
      }

      if (!newValue || newValue === oldValue) continue;

      if (
        typeof newValue === "string" &&
        newValue.length > 200 &&
        !newValue.startsWith("http")
      ) {
        console.error("❌ BLOCKED base64 write to DB for:", name);
        continue;
      }

      await knex("investigation_reports")
        .where("request_investigation_id", reportId)
        .whereIn("parameter_id", function () {
          this.select("id").from("testparameters").where("name", name);
        })
        .update({ value: newValue });
    }

    /* -------- SOCKET UPDATE -------- */

    if (sessionId && Number(sessionId) !== 0) {
      const socketData = {
        device_type: "App",
        investigation_reports_test_data: "update",
      };

      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Investigation report updated successfully",
    });
  } catch (err) {
    console.error("❌ Update Investigation Error:", err);
    return res.status(500).json({
      error: "Failed to update investigation report",
      details: err.message,
    });
  }
};

exports.deleteInvestigationReportById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, investigationReportId } = req.body;

    if (!investigationReportId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await knex("request_investigation")
      .where({ id: investigationReportId })
      .delete();

    await knex("reportnotes")
      .where({ reportId: investigationReportId })
      .delete();

    await knex("investigation_reports")
      .where({ request_investigation_id: investigationReportId })
      .delete();

    const userData = await knex("users").where({ id: userId }).first();

    if (sessionId) {
      const io = getIO();
      const roomName = `session_${sessionId}`;

      io.to(roomName).emit("patientNotificationPopup", {
        roomName,
        title: "Investigation Report Deleted",
        body: `A Investigation Report is deleted by ${userData.username}`,
        orgId: userData.organisation_id,
        created_by: userData.username,
        patient_id: patientId,
      });

      // io.to(roomName).emit("refreshPatientData");
      const socketData = {
        device_type: "App",
        investigation_reports: "update",
      };

      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2),
      );
    }

    if (investigationReportId && sessionId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Investigation Report Deleted",
              body: `A Investigation Report has been deleted for patient ${patientId}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(investigationReportId),
              type: "investigation_reports_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      investigationReportId,
      message: "Investigation Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted Investigation Report:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.addOrUpdateComment = async (req, res) => {
  try {
    const { id, patientId, report_id, userId, content, sessionId } = req.body;

    if (!patientId || !userId || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const userData = await knex("users").where({ id: userId }).first();
    let noteid;
    if (id) {
      await knex("reportnotes").where({ id: id }).update({
        note: content,
        addedBy: userId,
        updated_at: new Date(),
      });

      noteid = id;
    } else {
      const insertedIds = await knex("reportnotes").insert({
        note: content,
        addedBy: userId,
        reportId: report_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      noteid = insertedIds[0];
    }
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: id ? "Report Note Updated" : "Report Note Added",
      body: id
        ? `A New Report Note is updated by ${userData.username}`
        : `A New Report Note is added by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      notes: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    if (id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: id ? "Report Note Updated" : "New Report Note Added",
              body: id
                ? `A Report Note has been updated for patient ${patientId}.`
                : `A new Report Note has been added for patient ${patientId}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(id),
              type: id ? "note_updated" : "note_added",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      noteid,
      message: id
        ? "Report Note updated successfully"
        : "Report Note added successfully",
    });
  } catch (error) {
    console.error("Error adding Report Note:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteCommentById = async (req, res) => {
  try {
    const { patientId, userId, sessionId, commentId } = req.body;

    if (!commentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await knex("reportnotes").where({ id: commentId }).delete();

    const userData = await knex("users").where({ id: userId }).first();
    const io = getIO();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: "Report Note Deleted",
      body: `A Report Note is deleted by ${userData.username}`,
      orgId: userData.organisation_id,
      created_by: userData.username,
      patient_id: patientId,
    });

    // io.to(roomName).emit("refreshPatientData");
    const socketData = {
      device_type: "App",
      notes: "update",
    };

    io.to(roomName).emit(
      "refreshPatientData",
      JSON.stringify(socketData, null, 2),
    );

    console.log("Report Note hittt");

    if (commentId && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: userData.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          let token = user.fcm_token;

          const message = {
            notification: {
              title: "Report Note Deleted",
              body: `A Report Note has been deleted for patient ${patientId}.`,
            },
            token: token,
            data: {
              sessionId: sessionId,
              patientId: String(patientId),
              id: String(commentId),
              type: "report_note_deleted",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
            console.log(
              `✅ Notification sent to user ${user.id}:`,
              response.successCount,
            );

            const failedTokens = [];
            response.responses.forEach((r, i) => {
              if (!r.success) {
                failedTokens.push(token);
              }
            });

            if (failedTokens.length > 0) {
              const validTokens = token.filter(
                (t) => !failedTokens.includes(t),
              );
              await knex("users")
                .where({ id: user.id })
                .update({ fcm_tokens: JSON.stringify(validTokens) });
              console.log(
                `Removed invalid FCM tokens for user ${user.id}:`,
                failedTokens,
              );
            }
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr,
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      commentId,
      message: "Report Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleted Report Note:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getComments = async (req, res) => {
  const { patientId, report_id, user_id } = req.body;

  if (!report_id) {
    return res.status(400).json({
      success: false,
      message: "Invalid report ID",
    });
  }

  try {
    const commentsRaw = await knex("reportnotes")
      .leftJoin("users", "users.id", "reportnotes.addedBy")
      .where({ reportId: report_id })
      .where({ addedBy: user_id })
      .select(
        "users.username as person_name",
        "reportnotes.id",
        "reportnotes.note as content",
        "reportnotes.created_at as timestamp",
      )
      .orderBy("reportnotes.created_at", "desc");

    const comments = commentsRaw.map((c) => ({
      ...c,
      timestamp: new Date(c.timestamp).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }));
    return res.status(200).json({
      success: true,
      data: comments,
    });
    // return res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching list comments.",
    });
  }
};

exports.getDrugHierarchy = async (req, res) => {
  try {
    const rows = await knex("medications_list")
      .select("DrugGroup", "DrugSubGroup", "TypeofDrug", "medication", "dose")
      .orderBy("DrugGroup")
      .orderBy("DrugSubGroup")
      .orderBy("TypeofDrug");

    const safeValue = (val) =>
      val && String(val).trim() !== "" ? String(val).trim() : "NA";

    const hierarchy = [];

    for (const row of rows) {
      const drugGroupName = safeValue(row.DrugGroup);
      const subGroupName = safeValue(row.DrugSubGroup);
      const typeName = safeValue(row.TypeofDrug);
      const medName = safeValue(row.medication);
      const doseValue = safeValue(row.dose);

      // 1️⃣ Drug Group
      let group = hierarchy.find((g) => g.drug_group === drugGroupName);

      if (!group) {
        group = {
          drug_group: drugGroupName,
          sub_groups: [],
        };
        hierarchy.push(group);
      }

      // 2️⃣ Sub Group
      let subGroup = group.sub_groups.find(
        (sg) => sg.sub_group_name === subGroupName,
      );

      if (!subGroup) {
        subGroup = {
          sub_group_name: subGroupName,
          types: [],
        };
        group.sub_groups.push(subGroup);
      }

      // 3️⃣ Type
      let type = subGroup.types.find((t) => t.type_name === typeName);

      if (!type) {
        type = {
          type_name: typeName,
          medications: [],
        };
        subGroup.types.push(type);
      }

      // 4️⃣ Medication
      type.medications.push({
        name: medName,
        doses: doseValue,
      });
    }

    return res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error("Drug hierarchy error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build drug hierarchy",
    });
  }
};
>>>>>>> refs/remotes/origin/main
