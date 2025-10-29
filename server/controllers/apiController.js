const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const sendMail = require("../helpers/mailHelper");
const ejs = require("ejs");
const fs = require("fs");
const { getIO } = require("../websocket");

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

// patient summary details api 
exports.getPatientSummaryByIdApi = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ success: false, message: "patientId is required" });
    }

    // Fetch patient data
    const patient = await knex("patient_records")
      .where({ id: patientId })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .first();

    if (!patient) {
      return res.status(200).json({ success: false, message: "Patient not found" });
    }

    // Structure the data into summary sections
    const summary = {
      "ID": patient.id,
      "General Information": {
        "Name": patient.name,
        "Gender": patient.gender,
        "Phone": patient.phone,
        "Email": patient.email,
        "Address": patient.address,
        "Category": patient.category,
        "Location": patient.scenario_location,
        "Room Type": patient.room_type,
      },
      "Clinical Information": {
        "Height": patient.height,
        "Weight": patient.weight,
        "Date Of Birth": patient.date_of_birth
          ? new Date(patient.date_of_birth).toISOString().split("T")[0]
          : null,
        "Ethnicity": patient.ethnicity,
        "Nationality": patient.nationality,
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
        "Pharmaceuticals": patient.pharmaceuticals,
        "Diagnostic Equipment": patient.diagnostic_equipment,
        "Blood Tests": patient.blood_tests,
      },
      "Observations": {
        "Initial Admission Observations": patient.initial_admission_observations,
        "Expected Observations": patient.expected_observations_for_acute_condition,
        "Recommended Observations During Event":
          patient.recommended_observations_during_event,
        "Observation Results Recovery": patient.observation_results_recovery,
        "Observation Results Deterioration": patient.observation_results_deterioration,
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
exports.getPatientNoteByIdApi = async (req, res) => {
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

    const formattedNotes = notes.map(note => ({
      ...note,
      created_at: note.created_at
        ? new Date(note.created_at).toISOString().replace("T", " ").split(".")[0]
        : null,
      updated_at: note.updated_at
        ? new Date(note.updated_at).toISOString().replace("T", " ").split(".")[0]
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
exports.addOrUpdatePatientNoteApi = async (req, res) => {
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
    } = req.body;

    if (!patient_id || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "patient_id, title, and content are required",
      });
    }

    let noteId;

    if (id) {
      const updated = await knex("patient_notes")
        .where({ id })
        .update({
          patient_id,
          doctor_id: doctor_id || null,
          organisation_id: organisation_id || null,
          title,
          content,
          report_id: report_id || null,
          updated_at: knex.fn.now(),
        });

      if (!updated) {
        return res.status(200).json({
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
        report_id: report_id || null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });

      noteId = newNoteId;
    }

    // 🔁 Emit socket event
    if (sessionId) {
      const io = getIO();
      io.to(`session_${sessionId}`).emit("refreshPatientData");
    }

    // ✅ Response
    res.status(200).json({
      success: true,
      message: id
        ? "Patient note updated successfully"
        : "Patient note added successfully",
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
    console.error("Error adding/updating patient note:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// delete note Api 
exports.deleteNoteByIdApi = async (req, res) => {
  try {
    const { noteId, userId } = req.body;

    if (!noteId) {
      return res.status(400).json({ success: false, message: "Note ID is required." });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    // Fetch note from DB
    const note = await knex("patient_notes").where({ id: noteId }).first();

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
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
exports.getAllCategoriesInvestigationsByIdApi = async (req, res) => {
  try {
    const investigations = await knex("investigation")
      .leftJoin("users", "users.id", "=", "investigation.addedBy")
      .select("investigation.id", "investigation.category", "investigation.test_name")
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

// save investigation Api 
exports.saveRequestedInvestigationsApi = async (req, res) => {
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

      const sessionId = item.session_id || 0;

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

    await knex("request_investigation").insert(insertableInvestigations);

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








