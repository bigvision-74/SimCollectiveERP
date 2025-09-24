const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
require("dotenv").config();
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { getIO } = require("../websocket");

// Create a new patient
exports.createPatient = async (req, res) => {
  const patientData = req.body;
  try {
    // Validate required fields
    if (!patientData.name || !patientData.dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Name, date of birth, are required",
      });
    }

    // Check if email already exists
    if (patientData.email) {
      const existingEmail = await knex("patient_records")
        .where({ email: patientData.email })
        .first();
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Create new patient record with all fields
    const newPatient = {
      name: patientData.name,
      date_of_birth: patientData.dateOfBirth,
      gender: patientData.gender || null,
      type: patientData.type || null,
      category: patientData.category || null,
      ethnicity: patientData.ethnicity || null,
      nationality: patientData.nationality || null,
      height: patientData.height || null,
      weight: patientData.weight || null,
      email: patientData.email || null,
      phone: patientData.phone || null,
      scenario_location: patientData.scenarioLocation || null,
      room_type: patientData.roomType || null,
      address: patientData.address || null,
      social_economic_history: patientData.socialEconomicHistory || null,
      family_medical_history: patientData.familyMedicalHistory || null,
      lifestyle_and_home_situation:
        patientData.lifestyleAndHomeSituation || null,
      medical_equipment: patientData.medicalEquipment || null,
      pharmaceuticals: patientData.pharmaceuticals || null,
      diagnostic_equipment: patientData.diagnosticEquipment || null,
      blood_tests: patientData.bloodTests || null,
      initial_admission_observations:
        patientData.initialAdmissionObservations || null,
      expected_observations_for_acute_condition:
        patientData.expectedObservationsForAcuteCondition || null,
      patient_assessment: patientData.patientAssessment || null,
      recommended_observations_during_event:
        patientData.recommendedObservationsDuringEvent || null,
      observation_results_recovery:
        patientData.observationResultsRecovery || null,
      observation_results_deterioration:
        patientData.observationResultsDeterioration || null,
      recommended_diagnostic_tests:
        patientData.recommendedDiagnosticTests || null,
      treatment_algorithm: patientData.treatmentAlgorithm || null,
      correct_treatment: patientData.correctTreatment || null,
      expected_outcome: patientData.expectedOutcome || null,
      healthcare_team_roles: patientData.healthcareTeamRoles || null,
      team_traits: patientData.teamTraits || null,
      organisation_id: patientData.organisation_id || null,
      created_at: new Date(),
      updated_at: new Date(),
      status: patientData.status,
    };

    // Insert into database
    const result = await knex("patient_records").insert(newPatient);
    const patientDbId = result[0];

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      id: patientDbId,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const patientRecords = await knex("patient_records")
      .select("patient_records.*")
      // .where("type", "private")
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .orderBy("id", "desc");

    res.status(200).send(patientRecords);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

exports.getUserReport = async (req, res) => {
  try {
    const org = req.query.orgId;
    const userReports = await knex("investigation_reports")
      .join(
        "patient_records",
        "investigation_reports.patient_id",
        "patient_records.id"
      )
      .select("investigation_reports.*", "patient_records.name")
      .andWhere(function () {
        this.whereNull("patient_records.deleted_at").orWhere(
          "patient_records.deleted_at",
          ""
        );
      })
      .andWhere(function () {
        if (org && org != undefined && org != "undefined") {
          this.where("investigation_reports.organisation_id", org);
        }
      })
      .orderBy("investigation_reports.id", "desc");

    res.status(200).send(userReports);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

exports.getUserReportsListById_old = async (req, res) => {
  const { patientId, orgId } = req.params;

  try {
    const userReports = await knex("investigation_reports")
      .join(
        "patient_records",
        "investigation_reports.patient_id",
        "patient_records.id"
      )
      .leftJoin(
        "investigation",
        "investigation_reports.investigation_id",
        "investigation.id"
      )
      .where("investigation_reports.patient_id", patientId)
      .andWhere("investigation_reports.organisation_id", orgId)
      .andWhere(function () {
        this.whereNull("patient_records.deleted_at").orWhere(
          "patient_records.deleted_at",
          ""
        );
      })
      .groupBy([
        "investigation_reports.investigation_id",
        "investigation_reports.updated_at",
        "patient_records.name",
        "patient_records.id",
        "investigation.category",
        "investigation.test_name",
      ])
      .select(
        "investigation_reports.investigation_id",
        "investigation_reports.updated_at",
        knex.raw("MAX(investigation_reports.id) as latest_report_id"),
        knex.raw("MAX(investigation_reports.value) as value"),
        "patient_records.name",
        "patient_records.id as patient_id",
        "investigation.category",
        "investigation.test_name"
      )
      .orderBy("latest_report_id", "desc");

    res.status(200).send(userReports);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

exports.getUserReportsListById = async (req, res) => {
  const { patientId, orgId } = req.params;
  const { role } = req.query;

  try {
    let query = knex("investigation_reports")
      .join(
        "patient_records",
        "investigation_reports.patient_id",
        "patient_records.id"
      )
      .leftJoin(
        "investigation",
        "investigation_reports.investigation_id",
        "investigation.id"
      )
      .where("investigation_reports.patient_id", patientId)
      .andWhere(function () {
        this.whereNull("patient_records.deleted_at").orWhere(
          "patient_records.deleted_at",
          ""
        );
      });

    // ✅ Apply org filter only if not superadmin
    if (role !== "Superadmin") {
      query = query.andWhere("investigation_reports.organisation_id", orgId);
    }

    const userReports = await query
      .groupBy([
        "investigation_reports.investigation_id",
        "investigation_reports.updated_at",
        "patient_records.name",
        "patient_records.id",
        "investigation.category",
        "investigation.test_name",
      ])
      .select(
        "investigation_reports.investigation_id",
        "investigation_reports.updated_at",
        knex.raw("MAX(investigation_reports.id) as latest_report_id"),
        knex.raw("MAX(investigation_reports.value) as value"),
        "patient_records.name",
        "patient_records.id as patient_id",
        "investigation.category",
        "investigation.test_name"
      )
      .orderBy("latest_report_id", "desc");

    res.status(200).send(userReports);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

// delete patient
exports.deletePatients = async (req, res) => {
  try {
    const ids = req.body.ids;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        error: "Invalid request: IDs must be provided as an array.",
      });
    }

    const idsToDelete = Array.isArray(ids) ? ids : [ids];

    const patients = await knex("patient_records")
      .whereIn("id", idsToDelete)
      .select("id");

    if (patients.length === 0) {
      return res.status(404).json({
        message: "No patients found with the provided IDs.",
      });
    }

    // ✅ Update patient_deleted to 'deleted' for soft delete
    await knex("patient_records")
      .whereIn("id", idsToDelete)
      .update({ deleted_at: "deleted" });

    return res.status(200).json({
      message: "Patients deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting patients:", error);
    return res.status(500).json({
      message: "An error occurred while deleted patients.",
    });
  }
};

// edit patient data
exports.getPatientById = async (req, res) => {
  const { id } = req.params;

  // Validate ID
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const patient = await knex("patient_records")
      .select(
        "organisation_id as organization_id",
        "id",
        "name",
        knex.raw("DATE_FORMAT(date_of_birth, '%Y-%m-%d') as date_of_birth"),
        "gender",
        "type",
        "category",
        "ethnicity",
        "nationality",
        "height",
        "weight",
        "email",
        "phone",
        "scenario_location as scenarioLocation",
        "room_type as roomType",
        "address",
        "social_economic_history as socialEconomicHistory",
        "family_medical_history as familyMedicalHistory",
        "lifestyle_and_home_situation as lifestyleAndHomeSituation",
        "medical_equipment as medicalEquipment",
        "pharmaceuticals",
        "diagnostic_equipment as diagnosticEquipment",
        "blood_tests as bloodTests",
        "initial_admission_observations as initialAdmissionObservations",
        "expected_observations_for_acute_condition as expectedObservationsForAcuteCondition",
        "patient_assessment as patientAssessment",
        "recommended_observations_during_event as recommendedObservationsDuringEvent",
        "observation_results_recovery as observationResultsRecovery",
        "observation_results_deterioration as observationResultsDeterioration",
        "recommended_diagnostic_tests as recommendedDiagnosticTests",
        "treatment_algorithm as treatmentAlgorithm",
        "correct_treatment as correctTreatment",
        "expected_outcome as expectedOutcome",
        "healthcare_team_roles as healthcareTeamRoles",
        "team_traits as teamTraits"
      )
      .where({ id })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .first();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Error fetching patient by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient data",
    });
  }
};

// Update a patient
exports.updatePatient = async (req, res) => {
  const { id } = req.params;
  const patientData = req.body;

  try {
    // Validate required fields
    if (!patientData.name || !patientData.dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Name and Date of Birth are required",
      });
    }

    // Check if patient exists and not deleted
    const existingPatient = await knex("patient_records")
      .where({ id })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .first();

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if email is being updated and already exists for another patient
    if (patientData.email) {
      const existingEmail = await knex("patient_records")
        .where({ email: patientData.email })
        .andWhereNot({ id })
        .first();

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "emailExists",
        });
      }
    }

    const updatedPatient = {
      name: patientData.name,
      date_of_birth: patientData.dateOfBirth,
      gender: patientData.gender || null,
      type: patientData.type || null,
      category: patientData.category || null,
      ethnicity: patientData.ethnicity || null,
      nationality: patientData.nationality || null,
      height: patientData.height || null,
      weight: patientData.weight || null,
      email: patientData.email || null,
      phone: patientData.phone || null,
      scenario_location: patientData.scenarioLocation || null,
      room_type: patientData.roomType || null,
      address: patientData.address || null,
      social_economic_history: patientData.socialEconomicHistory || null,
      family_medical_history: patientData.familyMedicalHistory || null,
      lifestyle_and_home_situation:
        patientData.lifestyleAndHomeSituation || null,
      medical_equipment: patientData.medicalEquipment || null,
      pharmaceuticals: patientData.pharmaceuticals || null,
      diagnostic_equipment: patientData.diagnosticEquipment || null,
      blood_tests: patientData.bloodTests || null,
      initial_admission_observations:
        patientData.initialAdmissionObservations || null,
      expected_observations_for_acute_condition:
        patientData.expectedObservationsForAcuteCondition || null,
      patient_assessment: patientData.patientAssessment || null,
      recommended_observations_during_event:
        patientData.recommendedObservationsDuringEvent || null,
      observation_results_recovery:
        patientData.observationResultsRecovery || null,
      observation_results_deterioration:
        patientData.observationResultsDeterioration || null,
      recommended_diagnostic_tests:
        patientData.recommendedDiagnosticTests || null,
      treatment_algorithm: patientData.treatmentAlgorithm || null,
      correct_treatment: patientData.correctTreatment || null,
      expected_outcome: patientData.expectedOutcome || null,
      healthcare_team_roles: patientData.healthcareTeamRoles || null,
      team_traits: patientData.teamTraits || null,
      updated_at: new Date(),
      organisation_id: patientData.organization_id || null, // ✅ Required for saving org
      status: "completed",
    };

    await knex("patient_records").where({ id }).update(updatedPatient);

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
    });
  } catch (error) {
    console.error("Error updating patient:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};

// check already mailexicest in patient data
exports.checkEmailExists = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res
      .status(400)
      .json({ exists: false, message: "Email is required" });
  }

  try {
    const existing = await knex("patient_records")
      .where({ email })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .first();

    return res.json({ exists: !!existing });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ exists: false, message: "Server error" });
  }
};

// add patient note functon
exports.addPatientNote = async (req, res) => {
  const {
    patient_id,
    sessionId,
    title,
    content,
    doctor_id,
    organisation_id,
    report_id,
  } = req.body;
  const io = getIO();

  if (!patient_id || !title || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [newNoteId] = await knex("patient_notes").insert({
      patient_id,
      doctor_id,
      organisation_id,
      title,
      content,
      report_id: report_id || null,
      created_at: knex.fn.now(),
    });

    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    res.status(201).json({
      id: newNoteId,
      patient_id,
      doctor_id,
      organisation_id,
      title,
      content,
      report_id: report_id || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding patient note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch patient note by patient id
exports.getPatientNotesById = async (req, res) => {
  const patientId = req.params.patientId;
  const orgId = req.params.orgId;
  const role = req.query.role;
  const reportId = req.query.reportId;

  try {
    const query = knex("patient_notes as pn")
      .select(
        "pn.id",
        "pn.patient_id",
        "pn.doctor_id",
        "pn.title",
        "pn.content",
        "pn.created_at",
        "pn.updated_at",
        "pn.report_id",
        "u.fname as doctor_fname",
        "u.lname as doctor_lname"
      )
      .leftJoin("users as u", "pn.doctor_id", "u.id")
      .where("pn.patient_id", patientId)
      .orderBy("pn.created_at", "desc");

    // apply org filter only if NOT Superadmin
    if (role !== "Superadmin") {
      query.andWhere("pn.organisation_id", orgId);
    }

    if (reportId) {
      query.andWhere("pn.report_id", reportId);
    }

    const notes = await query;
    return res.status(200).json(notes);
  } catch (error) {
    console.error("Error fetching patient note by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient data",
    });
  }
};

// update patient note
exports.updatePatientNote = async (req, res) => {
  const noteId = req.params.id;
  const { title, content, sessionId } = req.body;
  const io = getIO();

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Title and content are required",
    });
  }

  try {
    const updated = await knex("patient_notes").where({ id: noteId }).update({
      title,
      content,
      updated_at: new Date(),
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const updatedNote = await knex("patient_notes")
      .where({ id: noteId })
      .first();

    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    return res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error updating patient note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update note",
    });
  }
};

// Observations add function
exports.addObservations = async (req, res) => {
  const io = getIO();
  const {
    patient_id,
    respiratoryRate,
    o2Sats,
    oxygenDelivery,
    bloodPressure,
    pulse,
    consciousness,
    temperature,
    news2Score,
    observations_by,
    organisation_id,
    sessionId,
    time_stamp,
  } = req.body;

  try {
    const [id] = await knex("observations").insert({
      patient_id,
      respiratory_rate: respiratoryRate,
      o2_sats: o2Sats,
      oxygen_delivery: oxygenDelivery,
      blood_pressure: bloodPressure,
      pulse,
      consciousness,
      temperature,
      news2_score: news2Score,
      observations_by,
      organisation_id,
      time_stamp,
    });
    const inserted = await knex("observations").where({ id }).first();

    // io.to(`refresh`).emit("refreshData");
    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    res.status(201).json(inserted);
  } catch (error) {
    console.error("Error adding Observations :", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch Observations by patient id
exports.getObservationsById = async (req, res) => {
  const patientId = req.params.patientId;
  const orgId = req.params.orgId;
  const role = req.query.role;

  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const query = knex("observations as o")
      .select(
        "o.id",
        "o.patient_id",
        "o.respiratory_rate as respiratoryRate",
        "o.o2_sats as o2Sats",
        "o.oxygen_delivery as oxygenDelivery",
        "o.blood_pressure as bloodPressure",
        "o.pulse",
        "o.consciousness",
        "o.temperature",
        "o.time_stamp",
        "o.news2_score as news2Score",
        "o.created_at",
        "u.fname as observer_fname",
        "u.lname as observer_lname"
      )
      .leftJoin("users as u", "o.observations_by", "u.id")
      .where("o.patient_id", patientId)
      .orderBy("o.created_at", "desc");

    if (role !== "Superadmin") {
      query.andWhere("o.organisation_id", orgId);
    }

    const observations = await query;

    res.status(200).json(observations);
  } catch (error) {
    console.error("Error fetching observations:", error);
    res.status(500).json({ message: "Failed to fetch observations" });
  }
};

// assign patient function
exports.assignPatients = async (req, res) => {
  const { userId, patientIds, assigned_by } = req.body;

  // Validation
  if (!userId || !Array.isArray(patientIds) || patientIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Missing or invalid userId/patientIds" });
  }

  try {
    await knex("assign_patient").where("user_id", userId).del();

    const assignmentData = patientIds.map((patientId) => ({
      user_id: userId,
      patient_id: patientId,
      assigned_by,
    }));

    await knex("assign_patient").insert(assignmentData);

    res.status(201).json({
      message: "Patients assigned successfully",
      assignedPatients: patientIds,
      userId,
      assigned_by,
    });
  } catch (error) {
    console.error("Error assigning patients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch assigend patient
exports.getAssignedPatients = async (req, res) => {
  const { userId } = req.params;

  try {
    const assignedPatients = await knex("assign_patient")
      .join(
        "patient_records",
        "assign_patient.patient_id",
        "patient_records.id"
      )
      .select(
        "patient_records.id",
        "patient_records.name",
        "patient_records.gender",
        "patient_records.phone",
        "patient_records.category",
        "patient_records.email",
        "patient_records.date_of_birth",
        "patient_records.type"
      )
      .where("assign_patient.user_id", userId);

    res.status(200).json(assignedPatients);
  } catch (error) {
    console.error("Error fetching assigned patients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getInvestigations = async (req, res) => {
  try {
    const investigations = await knex("investigation")
      .leftJoin("users", "users.id", "=", "investigation.addedBy")
      .select("investigation.*", "users.organisation_id", "users.role")
      .where("status", "active");

    // console.log(investigations,"investigationsinvestigations")

    res.status(200).json(investigations);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.saveRequestedInvestigations = async (req, res) => {
  const investigations = req.body;
  const { sessionId } = req.params;
  const io = getIO();
  try {
    if (!Array.isArray(investigations) || investigations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No investigations provided.",
      });
    }

    const errors = [];
    const insertableInvestigations = [];

    let patient_id;

    for (let index = 0; index < investigations.length; index++) {
      const item = investigations[index];

      if (
        !item.patient_id ||
        !item.request_by ||
        !item.category ||
        !item.test_name
      ) {
        errors.push(`Missing required fields in entry ${index + 1}`);
        continue;
      }

      patient_id = item.patient_id;

      const existing = await knex("request_investigation")
        .where({
          patient_id: item.patient_id,
          test_name: item.test_name,
          status: "pending",
          organisation_id: item.organisation_id,
          session_id: sessionId,
        })
        .first();

      if (existing) {
        errors.push(
          `Duplicate pending request for test "${item.test_name}" (entry ${index + 1
          })`
        );
        continue;
      }

      // Valid entry
      insertableInvestigations.push({
        patient_id: item.patient_id,
        request_by: item.request_by,
        category: item.category,
        test_name: item.test_name,
        status: "pending",
        organisation_id: item.organisation_id,
        session_id: sessionId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (insertableInvestigations.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No investigations inserted due to duplicates or validation errors.",
        insertedCount: 0,
        warnings: errors,
      });
    }

    await knex("request_investigation").insert(insertableInvestigations);
    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    return res.status(201).json({
      success: true,
      message: "Investigations saved successfully",
      insertedCount: insertableInvestigations.length,
      errors,
    });
  } catch (error) {
    console.error("Error saving investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save investigations",
    });
  }
};

// fetch selected request investigation check box
exports.getRequestedInvestigationsById = async (req, res) => {
  const { patientId, orgId } = req.params;
  const role = req.query.role;

  // Validate patientId
  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const query = knex("request_investigation")
      .select(
        "id",
        "patient_id as patientId",
        "request_by as requestedBy",
        "category",
        "test_name as testName",
        "status",
        knex.raw("DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as createdAt")
      )
      .where("patient_id", patientId)
      .andWhere("status", "pending")
      .orderBy("created_at", "desc");

    if (role !== "Superadmin") {
      query.andWhere("organisation_id", orgId);
    }
    const investigations = await query;

    if (!investigations || investigations.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: investigations,
    });
  } catch (error) {
    console.error("Error fetching requested investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch requested investigations",
    });
  }
};

// fetch only selected user org patient
exports.getPatientsByUserOrg = async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Get the user's org_id from the users table
    const user = await knex("users")
      .where("id", userId)
      .select("organisation_id")
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get patients who belong to the same org_id
    const patients = await knex("patient_records")
      .where("organisation_id", user.organisation_id)
      .andWhere("status", "completed")
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .select(
        "id",
        "name",
        "gender",
        "date_of_birth",
        "phone",
        "category",
        "organisation_id",
        "created_at",
        "status"
      )
      .orderBy("id", "desc");

    return res.status(200).json(patients);
  } catch (err) {
    console.error("Error fetching patients by user org:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// generate patient response with the help of ai function
exports.generateAIPatient = async (req, res) => {
  let { gender, room, speciality, condition, department, count } = req.body;

  if (!gender || !room || !speciality || !condition || !department) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: gender, room, speciality, condition, department",
    });
  }

  count = Math.max(1, Math.min(parseInt(count) || 1, 5));

  try {
    const systemPrompt = `
You are a medical AI that generates fictional but realistic patient records for training simulations.
You will receive patient criteria such as gender, room type, department, specialty, and medical condition.
Return ONLY a JSON array of patient objects (no extra text).
Patients should come from a range of Western nationalities such as American, British, Canadian, Australian, Irish, German, French, Italian, or Spanish.
Ensure nationality, name, and background are consistent.

Each patient object must contain:
- name: realistic full name matching gender
- dateOfBirth: ISO format (e.g., "1985-06-23") appropriate to adult/elderly age
- gender
- email: realistic and valid email format
- phone: 10-digit US phone number (e.g., 5551234567)
- height (in cm), weight (in kg)
- address: realistic street address
- roomType: use the provided room type
- scenarioLocation: use the department
- category: use the specialty
- ethnicity: relevant to US/UK population (e.g., Caucasian, African American, Hispanic)
- nationality: realistic (e.g., American, British, Canadian, Australian, German, French, Spanish, Italian, Irish)
- medicalEquipment: 1–2 appropriate items
- pharmaceuticals: 1–2 related to condition
- diagnosticEquipment: e.g., X-ray, MRI
- bloodTests: 1–2 related to condition
- initialAdmissionObservations: realistic vitals
- expectedObservationsForAcuteCondition
- patientAssessment
- recommendedObservationsDuringEvent
- observationResultsRecovery
- observationResultsDeterioration
- recommendedDiagnosticTests
- treatmentAlgorithm
- correctTreatment
- expectedOutcome
- healthcareTeamRoles
- teamTraits
- organisation_id: always return "1"

- socialEconomicHistory: brief info about the patient’s social and economic background
- familyMedicalHistory: common hereditary conditions or illnesses in the family
- lifestyleAndHomeSituation: brief overview of the patient’s lifestyle, living environment, and habits

Return only valid JSON.
`;

    const userPrompt = `Generate ${count} patient case(s) with:
- Gender: ${gender}
- Room Type: ${room}
- Specialty: ${speciality}
- Condition: ${condition}
- Department: ${department}
Make sure details are medically consistent.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
    });

    const rawOutput = completion.choices[0].message.content;

    let jsonData;
    try {
      jsonData = JSON.parse(rawOutput);
    } catch (parseError) {
      console.error("AI JSON Parse Error:", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response.",
        rawOutput,
      });
    }

    return res.status(200).json({
      success: true,
      data: jsonData,
    });
  } catch (err) {
    console.error("OpenAI Error:", err);
    return res.status(500).json({
      success: false,
      message: "AI patient generation failed.",
    });
  }
};

// save Ai generated patient data function
exports.saveGeneratedPatients = async (req, res) => {
  try {
    const patients = req.body;
    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({ message: "Invalid data." });
    }

    const toString = (val) => (Array.isArray(val) ? val.join(", ") : val || "");

    const formatted = patients.map((p) => ({
      organisation_id: p.organisationId || null,
      name: p.name,
      email: p.email,
      phone: p.phone,
      date_of_birth: p.dateOfBirth,
      gender: p.gender,
      type: p.type || "",
      address: p.address || "",
      category: p.category,
      ethnicity: p.ethnicity || "",
      nationality: p.nationality || "",
      height: p.height,
      weight: p.weight,
      scenario_location: p.scenarioLocation,
      room_type: p.roomType,
      social_economic_history: p.socialEconomicHistory || "",
      family_medical_history: p.familyMedicalHistory || "",
      lifestyle_and_home_situation: p.lifestyleAndHomeSituation || "",

      // Convert arrays to comma-separated strings
      medical_equipment: toString(p.medicalEquipment),
      pharmaceuticals: toString(p.pharmaceuticals),
      diagnostic_equipment: toString(p.diagnosticEquipment),
      blood_tests: toString(p.bloodTests),
      initial_admission_observations: toString(p.initialAdmissionObservations),
      expected_observations_for_acute_condition: toString(
        p.expectedObservationsForAcuteCondition
      ),
      patient_assessment: p.patientAssessment || "",
      recommended_observations_during_event: toString(
        p.recommendedObservationsDuringEvent
      ),
      observation_results_recovery: toString(p.observationResultsRecovery),
      observation_results_deterioration: toString(
        p.observationResultsDeterioration
      ),
      recommended_diagnostic_tests: toString(p.recommendedDiagnosticTests),
      treatment_algorithm: toString(p.treatmentAlgorithm),
      correct_treatment: p.correctTreatment || "",
      expected_outcome: p.expectedOutcome || "",
      healthcare_team_roles: toString(p.healthcareTeamRoles),
      team_traits: toString(p.teamTraits),
      patient_thumbnail: p.patientThumbnail || "",
      created_at: new Date(),
      updated_at: new Date(),
      organisation_id: p.organisationId || null,
      status: "completed",
    }));

    await knex("patient_records").insert(formatted);

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
    });
  }
};

exports.addInvestigation = async (req, res) => {
  const { category, test_name, addedBy } = req.body;
  if (!category || !test_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const [newNoteId] = await knex("investigation").insert({
      addedBy,
      category,
      test_name,
      status: "active",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
    res.status(201).json({
      test_name,
      category,
    });
  } catch (error) {
    console.error("Error adding patient note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const categories = await knex("investigation")
      .distinct("category")
      .orderBy("category", "asc");
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching investigation categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// exports.getAllRequestInvestigations = async (req, res) => {
//   const { user, role } = req.query;

//   try {
//     let orgId = null;

//     // If not superadmin, get the user's organisation ID
//     if (role !== "Superadmin" && user) {
//       const userData = await knex("users")
//         .where("uemail", user)
//         .first("organisation_id");

//       if (!userData || !userData.organisation_id) {
//         return res.status(403).json({
//           success: false,
//           message: "Organisation not found for this user.",
//         });
//       }

//       orgId = userData.organisation_id;
//     }

//     // Main query
//     const query = knex("request_investigation")
//       .leftJoin(
//         "patient_records",
//         "request_investigation.patient_id",
//         "patient_records.id"
//       )
//       .whereExists(function () {
//         this.select("*")
//           .from("request_investigation as ri2")
//           .whereRaw("ri2.patient_id = request_investigation.patient_id")
//           .andWhere("ri2.status", "!=", "complete");
//       });

//     // Only filter by organisation if orgId is set
//     if (orgId) {
//       query.andWhere("patient_records.organisation_id", orgId);
//     }

//     const results = await query
//       .distinct("request_investigation.patient_id")
//       .select(
//         "request_investigation.*",
//         "request_investigation.category as investCategory",
//         "patient_records.name",
//         "patient_records.email",
//         "patient_records.organisation_id",
//         "patient_records.phone",
//         "patient_records.date_of_birth",
//         "patient_records.gender",
//         "patient_records.category"
//       )
//       .orderBy("request_investigation.created_at", "desc");

//     return res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching investigations:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch investigations",
//     });
//   }
// };

exports.getAllRequestInvestigations = async (req, res) => {
  const { user, role } = req.query;

  try {
    let orgId = null;

    // 🔹 If not superadmin, get the user's organisation ID
    if (role !== "Superadmin" && user) {
      const userData = await knex("users")
        .where("uemail", user)
        .first("organisation_id");

      if (!userData || !userData.organisation_id) {
        return res.status(403).json({
          success: false,
          message: "Organisation not found for this user.",
        });
      }

      orgId = userData.organisation_id;
    }

    const query = knex("request_investigation")
      .leftJoin(
        "patient_records",
        "request_investigation.patient_id",
        "patient_records.id"
      )
      // .where("patient_records.organisation_id", orgId)
      .whereExists(function () {
        this.select("*")
          .from("request_investigation as ri2")
          .whereRaw("ri2.patient_id = request_investigation.patient_id")
          .andWhere("ri2.status", "!=", "complete")
          .andWhereRaw(
            "ri2.organisation_id = request_investigation.organisation_id"
          );
      });

    if (orgId) {
      query.andWhere("request_investigation.organisation_id", orgId);
    }

    const results = await query
      .distinct("request_investigation.patient_id")
      .select(
        "request_investigation.*",
        "request_investigation.category as investCategory",
        "patient_records.name",
        "patient_records.email",
        "patient_records.organisation_id as patient_org_id",
        "patient_records.phone",
        "patient_records.date_of_birth",
        "patient_records.gender",
        "patient_records.category"
      )
      .orderBy("request_investigation.created_at", "desc");
    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
    });
  }
};

exports.getPatientRequests = async (req, res) => {
  const { userId } = req.params;
  const { orgId } = req.query;

  try {
    const request_investigation = await knex("request_investigation")
      .leftJoin(
        "patient_records",
        "request_investigation.patient_id",
        "patient_records.id"
      )
      .leftJoin(
        "investigation",
        "request_investigation.test_name",
        "investigation.test_name"
      )
      .leftJoin("users", "request_investigation.request_by", "users.id")
      .leftJoin("session", "request_investigation.session_id", "session.id")
      .where("request_investigation.status", "!=", "complete")
      .where({ "request_investigation.patient_id": userId })
      .andWhere("request_investigation.organisation_id", orgId)
      .select(
        "investigation.id as investId",
        "users.fname as request_first_name",
        "users.lname as request_last_name",
        "request_investigation.*",
        "request_investigation.category as investCategory",
        "patient_records.name",
        "patient_records.email",
        "patient_records.organisation_id",
        "patient_records.phone",
        "patient_records.date_of_birth",
        "patient_records.gender",
        "patient_records.category",
        "session.name as session_name"
      )
      .orderBy("request_investigation.created_at", "desc");

    return res.status(200).json(request_investigation);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
    });
  }
};

exports.getInvestigationParams = async (req, res) => {
  const { id } = req.params;

  try {
    const test_parameters = await knex("test_parameters")
      .leftJoin(
        "investigation",
        "test_parameters.investigation_id",
        "investigation.id"
      )
      .leftJoin("users", "users.id", "=", "test_parameters.addedBy")
      .where({ "test_parameters.investigation_id": id })
      .select(
        "test_parameters.*",
        "investigation.category",
        "investigation.id as investId",
        "investigation.test_name",
        "test_parameters.addedBy",
        "users.organisation_id",
        "users.role"
      )
      .orderBy("test_parameters.created_at", "desc");

    return res.status(200).json(test_parameters);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
    });
  }
};

exports.getInvestigationReports = async (req, res) => {
  const { patientId, investigationId, orgId } = req.params;
  const { role } = req.query;

  try {
    let query = knex("investigation_reports")
      .leftJoin(
        "test_parameters",
        "investigation_reports.parameter_id",
        "test_parameters.id"
      )
      .leftJoin("users", "investigation_reports.submitted_by", "users.id")
      .where("investigation_reports.patient_id", patientId)
      .where("investigation_reports.investigation_id", investigationId);

    if (role !== "Superadmin") {
      query = query.andWhere("investigation_reports.organisation_id", orgId);
    }

    const test_parameters = await query
      .select(
        "test_parameters.id",
        "test_parameters.name",
        "test_parameters.normal_range",
        "test_parameters.units",
        "investigation_reports.value",
        "investigation_reports.created_at",
        "investigation_reports.scheduled_date",
        "investigation_reports.submitted_by",
        "users.fname as submitted_by_fname",
        "users.lname as submitted_by_lname"
      )
      .orderBy("test_parameters.id", "asc");

    return res.status(200).json(test_parameters);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
    });
  }
};

exports.submitInvestigationResults = async (req, res) => {
  const { payload } = req.body;

  if (!Array.isArray(payload) || !payload.length) {
    return res.status(400).json({ message: "Missing or invalid payload" });
  }

  try {
    const investigationId = payload[0]?.investigation_id;
    const patientId = payload[0]?.patient_id;
    const submittedBy = payload[0]?.submitted_by;
    const sessionId = payload[0]?.sessionId;
    const io = getIO();

    if (!investigationId) {
      throw new Error("Missing investigation_id in payload");
    }

    if (!patientId) {
      throw new Error("Missing patient_id in payload");
    }

    const investionData = await knex("investigation")
      .where({ id: investigationId })
      .first();

    await knex("request_investigation")
      .where({
        test_name: investionData.test_name,
        patient_id: patientId,
        organisation_id: payload[0]?.organisation_id,
        session_id: sessionId,
      })
      .update({ status: "complete" });

    const resultData = payload.map((param) => ({
      request_investigation_id: param.request_investigation_id,
      investigation_id: param.investigation_id,
      parameter_id: param.parameter_id,
      patient_id: param.patient_id,
      value: param.value,
      submitted_by: param.submitted_by || submittedBy,
      scheduled_date: param.scheduled_date || null,
      organisation_id: param.organisation_id || null,
    }));

    await knex("investigation_reports").insert(resultData);

    const requestRow = await knex("request_investigation")
      .where({
        test_name: investionData.test_name,
        patient_id: patientId,
        organisation_id: payload[0]?.organisation_id,
      })
      .orderBy("id", "desc")
      .first();

    const requestedBy = requestRow?.request_by;

    // ✅ Create a notification
    if (requestedBy) {
      await knex("notifications").insert({
        notify_by: submittedBy,
        notify_to: requestedBy,
        title: "New Investigation Report Request",
        message: `New investigation results for ${investionData.test_name} have been submitted for patient.`,
        status: "unseen",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    res.status(201).json({
      message: "Results submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting results:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.saveFluidBalance = async (req, res) => {
  const {
    patient_id,
    observations_by,
    organisation_id,
    fluid_intake,
    fluid_output,
    sessionId,
  } = req.body;
  const io = getIO();
  try {
    const [insertId] = await knex("fluid_balance").insert({
      patient_id,
      observations_by,
      organisation_id,
      fluid_intake,
      fluid_output,
    });

    const savedRow = await knex("fluid_balance").where("id", insertId).first();
    const roomName = `session_${sessionId}`;

    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    res.status(200).json(savedRow);
  } catch (error) {
    console.error("Error saving fluid balance:", error);
    res.status(500).json({ message: "Failed to save fluid balance" });
  }
};

// fecth fluid balance function
exports.getFluidBalanceByPatientId = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const orgId = req.params.orgId;
    const role = req.query.role;

    if (!patient_id) {
      return res.status(400).json({ error: "Missing patient_id" });
    }

    const query = knex("fluid_balance as f")
      .select(
        "f.id",
        "f.patient_id",
        "f.observations_by",
        "f.fluid_intake",
        "f.fluid_output",
        "f.created_at",
        "f.updated_at",
        "u.fname as observer_fname",
        "u.lname as observer_lname"
      )
      .leftJoin("users as u", "f.observations_by", "u.id")
      .where("f.patient_id", patient_id)
      .orderBy("f.created_at", "desc");

    if (role !== "Superadmin") {
      query.andWhere("f.organisation_id", orgId);
    }
    const fluidData = await query;

    return res.status(200).json(fluidData);
  } catch (error) {
    console.error("Error in getFluidBalanceByPatientId:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.saveParamters = async (req, res) => {
  const {
    title,
    normal_range,
    units,
    category,
    field_type,
    test_name,
    addedBy,
  } = req.body;

  if (
    !title ||
    !normal_range ||
    !units ||
    !category ||
    !field_type ||
    !test_name ||
    !addedBy
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const investionData = await knex("investigation")
      .where({ category: category })
      .where({ test_name: test_name })
      .first();

    const resultData = {
      investigation_id: investionData.id,
      name: title,
      normal_range: normal_range,
      units: units,
      field_type: field_type,
      created_at: new Date(),
      updated_at: new Date(),
      addedBy: addedBy === "null" ? null : addedBy,
    };

    await knex("test_parameters").insert(resultData);

    res.status(201).json({
      message: "Results submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting results:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetching all type investigation resuest funciton
exports.getAllTypeRequestInvestigation = async (req, res) => {
  try {
    const userEmail = req.user.email; // From decoded token
    const user = await knex("users").where("uemail", userEmail).first();

    // If Superadmin, return all investigations
    if (user.role === "Superadmin" || user.role === "Administrator") {
      const allInvestigations = await knex("request_investigation")
        .leftJoin(
          "patient_records",
          "request_investigation.patient_id",
          "patient_records.id"
        )
        .select(
          "request_investigation.*",
          "request_investigation.category as investCategory",
          "patient_records.name",
          "patient_records.date_of_birth",
          "patient_records.gender",
          "patient_records.category"
        )
        .orderBy("request_investigation.created_at", "desc");

      return res.status(200).json(allInvestigations);
    }

    // For Admin - filter by organisation_id
    const orgInvestigations = await knex("request_investigation")
      .leftJoin(
        "patient_records",
        "request_investigation.patient_id",
        "patient_records.id"
      )
      .where("patient_records.organisation_id", user.organisation_id)
      .select(
        "request_investigation.*",
        "request_investigation.category as investCategory",
        "patient_records.name",
        "patient_records.date_of_birth",
        "patient_records.gender",
        "patient_records.category"
      )
      .orderBy("request_investigation.created_at", "desc");

    return res.status(200).json(orgInvestigations);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
    });
  }
};

exports.deletePatientNote = async (req, res) => {
  try {
    const io = getIO();
    const noteId = req.params.id;
    const { sessionId } = req.body;
    const patient = await knex("patient_notes").where({ id: noteId }).first();

    if (!noteId) {
      return res.status(400).json({ error: "Note ID is required." });
    }

    const deletedCount = await knex("patient_notes").where("id", noteId).del();

    if (deletedCount === 0) {
      return res.status(404).json({ message: "Note not found." });
    }

    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");

    return res.status(200).json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("Error deleting patient note:", error);
    return res.status(500).json({ message: "Failed to delete patient note." });
  }
};

// API endpoint for updating a category
exports.updateCategory = async (req, res) => {
  const { oldCategory, newCategory } = req.body;

  try {
    // Validate input
    if (!oldCategory || !newCategory) {
      return res.status(400).json({
        success: false,
        message: "Both old and new category names are required",
      });
    }

    // Update all investigations with the old category name
    const updated = await knex("investigation")
      .where("category", oldCategory)
      .update({ category: newCategory });

    console.log(
      `Updated ${updated} records for category ${oldCategory} to ${newCategory}`
    );

    return res.status(200).json({
      success: true,
      message: `Category updated successfully`,
      data: {
        oldCategory,
        newCategory,
        updatedCount: updated,
      },
    });
  } catch (error) {
    console.error("Error updating investigation category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

exports.deletetestparams = async (req, res) => {
  const { id } = req.params;
  try {
    await knex("test_parameters").where({ id: id }).del();
    res.status(201).json({
      message: "Params deleted successfully",
    });
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete params",
    });
  }
};

exports.addPrescription = async (req, res) => {
  try {
    const {
      patient_id,
      sessionId,
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
    } = req.body;

    // Validation
    if (
      !patient_id ||
      !doctor_id ||
      !organisation_id ||
      !medication_name ||
      !dose ||
      !route ||
      !start_date ||
      !administration_time
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const io = getIO();
    // Insert into prescriptions table
    const [id] = await knex("prescriptions").insert({
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
      created_at: new Date(),
      updated_at: new Date(),
    });

    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("refreshPatientData");

    return res.status(201).json({
      id,
      message: "Prescription added successfully",
    });
  } catch (error) {
    console.error("Error adding prescription:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// fetch pres funciton to display in list
exports.getPrescriptionsByPatientId = async (req, res) => {
  const patientId = req.params.id;
  const orgId = req.params.orgId;
  const role = req.query.role;

  // Validate ID
  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const query = knex("prescriptions as p")
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
        "p.route",
        "p.created_at",
        "p.updated_at",
        "u.fname as doctor_fname",
        "u.lname as doctor_lname"
      )
      .leftJoin("users as u", "p.doctor_id", "u.id")
      .where("p.patient_id", patientId)
      .orderBy("p.created_at", "desc");

    if (role !== "Superadmin") {
      query.andWhere("p.organisation_id", orgId);
    }

    const prescriptions = await query;

    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions by patient ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
    });
  }
};

exports.updateParams = async (req, res) => {
  const {
    investigation_id,
    test_name,
    category,
    parameters,
    original_category,
  } = req.body;

  try {
    await knex.transaction(async (trx) => {
      if (test_name) {
        await trx("investigation").where("id", investigation_id).update({
          test_name,
          updated_at: trx.fn.now(),
        });
      }

      // 2️⃣ Update category for all rows where original_category matches
      if (category && original_category) {
        await trx("investigation")
          .where("category", original_category) // use the previous category value
          .update({
            category,
            updated_at: trx.fn.now(),
          });
      }

      let paramsArray = parameters;
      if (typeof parameters === "string") {
        try {
          paramsArray = JSON.parse(parameters);
        } catch (e) {
          console.error("Failed to parse parameters:", e);
          throw new Error("Invalid parameters format");
        }
      }

      console.log(original_category, "original_category");

      if (paramsArray && Array.isArray(paramsArray)) {
        for (const param of paramsArray) {
          await trx("test_parameters").where("id", param.id).update({
            name: param.name,
            normal_range: param.normal_range,
            units: param.units,
            updated_at: knex.fn.now(),
          });
        }
      } else {
        console.log("No valid parameters array provided");
      }
    });

    res.json({
      success: true,
      message: "Updated successfully",
    });
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update",
      error: error.message,
    });
  }
};

exports.updatePrescription = async (req, res) => {
  const prescriptionId = req.params.id;
  const {
    description,
    medication_name,
    indication,
    dose,
    route,
    start_date,
    days_given,
    administration_time,
    patient_id,
    doctor_id,
  } = req.body;
  const io = getIO();

  if (
    !description ||
    !medication_name ||
    !indication ||
    !dose ||
    !route ||
    !start_date ||
    !days_given ||
    !administration_time ||
    !patient_id ||
    !doctor_id
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const updated = await knex("prescriptions")
      .where({ id: prescriptionId })
      .update({
        description,
        medication_name,
        indication,
        dose,
        route,
        start_date,
        days_given,
        administration_time,
        patient_id,
        doctor_id,
        updated_at: new Date(),
      });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const updatedPrescription = await knex("prescriptions")
      .where({ id: prescriptionId })
      .first();

    const roomName = `patient_${patient_id}`;
    io.to(roomName).emit("refreshPatientData");
    console.log(`[Backend] Sent refreshPatientData to room ${roomName}`);

    return res.status(200).json(updatedPrescription);
  } catch (error) {
    console.error("Error updating prescription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update prescription",
    });
  }
};

// get all public patient
exports.getAllPublicPatients = async (req, res) => {
  try {
    const patientRecords = await knex("patient_records")
      .select("patient_records.*")
      .where("type", "public")
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .orderBy("id", "desc");

    res.status(200).send(patientRecords);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

// getReportTemplates
exports.getReportTemplates = async (req, res) => {
  try {
    const { investigationId, patientId } = req.query;
    console.log(investigationId, "investigationId");
    console.log(patientId, "patientId");

    if (!investigationId || !patientId) {
      return res
        .status(400)
        .json({ error: "investigationId and patientId are required" });
    }

    const rows = await knex("investigation_reports as ir")
      .join("test_parameters as tp", "ir.parameter_id", "tp.id")
      .select(
        "ir.id as report_id",
        "ir.request_investigation_id",
        "ir.investigation_id",
        "ir.parameter_id",
        "ir.patient_id",
        "ir.submitted_by",
        "ir.value",
        "ir.organisation_id",
        "ir.scheduled_date",
        "ir.created_at",
        "ir.updated_at",
        "tp.name as parameter_name",
        "tp.normal_range",
        "tp.units",
        "tp.field_type"
      )
      .where("ir.investigation_id", investigationId)
      .andWhere("ir.patient_id", patientId)
      .orderBy("ir.created_at", "desc")
      .orderBy("tp.name", "asc");

    const templatesMap = {};
    rows.forEach((row) => {
      const groupId = row.request_investigation_id;

      if (!templatesMap[groupId]) {
        templatesMap[groupId] = {
          id: groupId,
          name: `Report ${groupId}`,
          investigation_id: row.investigation_id,
          patient_id: row.patient_id,
          submitted_by: row.submitted_by,
          created_at: row.created_at,
          parameters: [],
        };
      }

      templatesMap[groupId].parameters.push({
        parameter_id: row.parameter_id,
        name: row.parameter_name,
        // value: row.value,
        value: row.value ?? "",
        normal_range: row.normal_range,
        units: row.units,
        field_type: row.field_type,
      });
    });

    // Convert to array and return
    const templates = Object.values(templatesMap);
    res.json(templates);
  } catch (err) {
    console.error("Error fetching report templates:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.addNewMedication = async (req, res) => {
  const { medication, dose, userEmail } = req.body;
  if (!medication || !dose) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const userData = await knex("users").where({ uemail: userEmail }).first();

    const [newNoteId] = await knex("medications_list").insert({
      medication,
      dose,
      added_by: userData.id,
      org_id: userData.organisation_id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
    res.status(201).json({
      medication,
      dose,
    });
  } catch (error) {
    console.error("Error adding patient note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateMedication = async (req, res) => {
  const { medication, dose, id } = req.body;

  if (!medication || !dose) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const medications = await knex("medications_list").where({ id }).first();

    if (!medications) {
      return res.status(404).json({ message: "Medication not found" });
    }

    const updatedCount = await knex("medications_list")
      .where({ id })
      .update({
        medication,
        dose,
        added_by: medications.added_by,
        org_id: medications.org_id || null,
        updated_at: knex.fn.now(),
      });

    res.status(200).json({
      message: "Medication updated successfully",
      updatedCount,
      medication,
      dose,
    });
  } catch (error) {
    console.error("Error updating medication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteMedication = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedCount = await knex("medications_list").where({ id }).delete();

    res.status(200).json({
      message: "Medication deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting medication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /medications_list
exports.getAllMedications = async (req, res) => {
  try {
    const medications = await knex("medications_list").select(
      "id",
      "medication",
      "dose"
    );

    const normalized = medications.map((m) => ({
      ...m,
      dose: JSON.parse(m.dose),
    }));

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching medications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET IMAGE TESTS FOR CATEGORY
exports.getImageTestsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const rows = await knex("investigation as inv")
      .join("test_parameters as tp", "tp.investigation_id", "inv.id")
      .select(
        "inv.id",
        "inv.test_name",
        "inv.category",
        knex.raw("MIN(tp.id) as test_parameter_id") // pick one test parameter
      )
      .where("inv.category", category)
      .andWhere("tp.field_type", "image")
      .groupBy("inv.id", "inv.test_name", "inv.category")
      .orderBy("inv.test_name", "asc");


    res.json(rows);
  } catch (err) {
    console.error("Error fetching image tests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// save image function 
exports.uploadImagesToLibrary = async (req, res) => {
  try {
    const { test_name, investigation_id, images, added_by } = req.body;

    if (!images || images.length === 0) return res.status(400).json({ error: "No images provided" });

    const uploadedImages = images.map((url) => ({
      investigation_id,
      test_parameters: test_name,
      added_by,
      image_url: url,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await knex("image_library").insert(uploadedImages);

    res.json({ message: "Images uploaded successfully", data: uploadedImages });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// already exesting  image function  
exports.getImagesByInvestigation = async (req, res) => {
  try {
    const { investigation_id } = req.params;
    if (!investigation_id) {
      return res.status(400).json({ error: "investigation_id is required" });
    }

    const images = await knex("image_library")
      .select("id", "image_url", "test_parameters", "added_by", "status", "created_at")
      .where({ investigation_id: Number(investigation_id) });

    res.json({ images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};




