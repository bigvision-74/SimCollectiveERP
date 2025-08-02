const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
require("dotenv").config();
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      category: patientData.category || null,
      ethnicity: patientData.ethnicity || null,
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
        if (org && org != undefined && org != 'undefined') {
          this.where("patient_records.organisation_id", org);
        }
      })
      .orderBy("investigation_reports.id", "desc");

    res.status(200).send(userReports);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

exports.getUserReportsListById = async (req, res) => {
  const { id } = req.params;

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
      .where({ "investigation_reports.patient_id": id })
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
        "category",
        "ethnicity",
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
      category: patientData.category || null,
      ethnicity: patientData.ethnicity || null,
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
  const { patient_id, title, content, doctor_id } = req.body;

  if (!patient_id || !title || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [newNoteId] = await knex("patient_notes").insert({
      patient_id,
      doctor_id,
      title,
      content,
      created_at: knex.fn.now(),
    });

    res.status(201).json({
      id: newNoteId, // Return the new ID manually
      patient_id,
      doctor_id,
      title,
      content,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding patient note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch patient note by patient id
exports.getPatientNotesById = async (req, res) => {
  const patientId = req.params.id;

  // Validate ID
  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const notes = await knex("patient_notes as pn")
      .select(
        "pn.id",
        "pn.patient_id",
        "pn.doctor_id",
        "pn.title",
        "pn.content",
        "pn.created_at",
        "pn.updated_at",
        "u.fname as doctor_fname",
        "u.lname as doctor_lname"
      )
      .leftJoin("users as u", "pn.doctor_id", "u.id")
      .where("pn.patient_id", patientId)
      .orderBy("pn.created_at", "desc");

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
  const { title, content } = req.body;

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
  const {
    patient_id,
    respiratoryRate,
    o2Sats,
    spo2Scale,
    oxygenDelivery,
    bloodPressure,
    pulse,
    consciousness,
    temperature,
    news2Score,
    observations_by,
  } = req.body;

  // const observations_by = req.user?.uid;

  try {
    const [id] = await knex("observations").insert({
      patient_id,
      respiratory_rate: respiratoryRate,
      o2_sats: o2Sats,
      spo2_scale: spo2Scale,
      oxygen_delivery: oxygenDelivery,
      blood_pressure: bloodPressure,
      pulse,
      consciousness,
      temperature,
      news2_score: news2Score,
      observations_by,
    });
    const inserted = await knex("observations").where({ id }).first();
    res.status(201).json(inserted);
  } catch (error) {
    console.error("Error adding Observations :", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch Observations by patient id
exports.getObservationsById = async (req, res) => {
  const patientId = req.params.id;

  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const observations = await knex("observations as o")
      .select(
        "o.id",
        "o.patient_id",
        "o.respiratory_rate as respiratoryRate",
        "o.o2_sats as o2Sats",
        "o.spo2_scale as spo2Scale",
        "o.oxygen_delivery as oxygenDelivery",
        "o.blood_pressure as bloodPressure",
        "o.pulse",
        "o.consciousness",
        "o.temperature",
        "o.news2_score as news2Score",
        "o.created_at",
        "u.fname as observer_fname",
        "u.lname as observer_lname"
      )
      .leftJoin("users as u", "o.observations_by", "u.id")
      .where("o.patient_id", patientId)
      .orderBy("o.created_at", "desc");

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
        "patient_records.date_of_birth"
      )
      .where("assign_patient.user_id", userId);

    res.status(200).json(assignedPatients);
  } catch (error) {
    console.error("Error fetching assigned patients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// fetch investigation test List data
exports.getInvestigations = async (req, res) => {
  try {
    const investigations = await knex("investigation")
      .select("id", "category", "test_name", "status")
      .where("status", "active");

    res.status(200).json(investigations);
  } catch (error) {
    console.error("Error fetching investigations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// // save request investigation
exports.saveRequestedInvestigations = async (req, res) => {
  const investigations = req.body;

  try {
    // Validate required data
    if (!Array.isArray(investigations) || investigations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No investigations provided.",
      });
    }

    const errors = [];
    const insertableInvestigations = [];

    for (let index = 0; index < investigations.length; index++) {
      const item = investigations[index];

      // Basic validation
      if (
        !item.patient_id ||
        !item.request_by ||
        !item.category ||
        !item.test_name
      ) {
        errors.push(`Missing required fields in entry ${index + 1}`);
        continue;
      }

      // Check for existing pending request
      const existing = await knex("request_investigation")
        .where({
          patient_id: item.patient_id,
          test_name: item.test_name,
          status: "pending",
        })
        .first();

      if (existing) {
        errors.push(
          `Duplicate pending request for test "${item.test_name}" (entry ${index + 1})`
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
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (insertableInvestigations.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No investigations inserted due to duplicates or validation errors.",
        errors,
      });
    }

    await knex("request_investigation").insert(insertableInvestigations);

    return res.status(201).json({
      success: true,
      message: "Investigations saved successfully",
      insertedCount: insertableInvestigations.length,
      errors, // show skipped/duplicate errors if any
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
  const { patientId } = req.params;

  // Validate patientId
  if (!patientId || isNaN(Number(patientId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID",
    });
  }

  try {
    const investigations = await knex("request_investigation")
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

    if (!investigations || investigations.length === 0) {
      return res.status(200).json({
        success: true,
        data: [], // just send an empty array
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
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .select("id", "name", "gender", "date_of_birth", "phone", "category", "organisation_id", "created_at")
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

  // ✅ Now this reassignment will work
  count = Math.max(1, Math.min(parseInt(count) || 1, 5));

  try {
    const systemPrompt = `
You are a medical AI that generates fictional but realistic patient records for training simulations.
You will receive patient criteria such as gender, room type, department, specialty, and medical condition.
Return ONLY a JSON array of patient objects (no extra text).

Each patient object must contain:
- name: realistic full name matching gender
- dateOfBirth: ISO format (e.g., "1985-06-23") appropriate to adult/elderly age
- gender
- email: realistic and valid email format
- phone: 10-digit Indian phone number
- height (in cm), weight (in kg)
- address: realistic street address
- roomType: use the provided room type
- scenarioLocation: use the department
- category: use the specialty
- ethnicity: relevant to Indian population (e.g., South Asian)
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
      address: p.address || "",
      category: p.category,
      ethnicity: p.ethnicity || "",
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
  const { category, test_name } = req.body;
  if (!category || !test_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const [newNoteId] = await knex("investigation").insert({
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

exports.getAllRequestInvestigations_OLD = async (req, res) => {
  try {
    const request_investigation = await knex("request_investigation")
      .leftJoin(
        "patient_records",
        "request_investigation.patient_id",
        "patient_records.id"
      )
      .whereExists(function () {
        this.select("*")
          .from("request_investigation as ri2")
          .whereRaw("ri2.patient_id = request_investigation.patient_id")
          .andWhere("ri2.status", "!=", "complete");
      })
      .distinct("request_investigation.patient_id")
      .select(
        "request_investigation.*",
        "request_investigation.category as investCategory",
        "patient_records.name",
        "patient_records.email",
        "patient_records.organisation_id",
        "patient_records.phone",
        "patient_records.date_of_birth",
        "patient_records.gender",
        "patient_records.category"
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

exports.getAllRequestInvestigations = async (req, res) => {
  const { user, role } = req.query;

  try {
    let orgId = null;

    // If not superadmin, get the user's organisation ID
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

    // Main query
    const query = knex("request_investigation")
      .leftJoin("patient_records", "request_investigation.patient_id", "patient_records.id")
      .whereExists(function () {
        this.select("*")
          .from("request_investigation as ri2")
          .whereRaw("ri2.patient_id = request_investigation.patient_id")
          .andWhere("ri2.status", "!=", "complete");
      });

    // Only filter by organisation if orgId is set
    if (orgId) {
      query.andWhere("patient_records.organisation_id", orgId);
    }

    const results = await query
      .distinct("request_investigation.patient_id")
      .select(
        "request_investigation.*",
        "request_investigation.category as investCategory",
        "patient_records.name",
        "patient_records.email",
        "patient_records.organisation_id",
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
      .where("request_investigation.status", "!=", "complete")
      .where({ "request_investigation.patient_id": userId })
      .select(
        "investigation.id as investId",
        "request_investigation.*",
        "request_investigation.category as investCategory",
        "patient_records.name",
        "patient_records.email",
        "patient_records.organisation_id",
        "patient_records.phone",
        "patient_records.date_of_birth",
        "patient_records.gender",
        "patient_records.category"
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
      .where({ "test_parameters.investigation_id": id })
      .select(
        "test_parameters.*",
        "investigation.category",
        "investigation.id as investId",
        "investigation.test_name"
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

exports.getInvestigationReports_old = async (req, res) => {
  const { id } = req.params;

  try {
    const test_parameters = await knex("investigation_reports")
      .leftJoin(
        "test_parameters",
        "investigation_reports.parameter_id",
        "test_parameters.id"
      )
      .leftJoin(
        "request_investigation",
        "investigation_reports.patient_id",
        "request_investigation.patient_id"
      )
      .where("request_investigation.status", "!=", "complete")
      .where("investigation_reports.investigation_id", id)
      .select(
        "test_parameters.id",
        "test_parameters.name",
        "test_parameters.normal_range",
        "test_parameters.units",
        knex.raw("MAX(investigation_reports.value) as value"),
        knex.raw("MAX(investigation_reports.created_at) as created_at")
      )
      .groupBy(
        "test_parameters.id",
        "test_parameters.name",
        "test_parameters.normal_range",
        "test_parameters.units"
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

exports.getInvestigationReports = async (req, res) => {
  const { id } = req.params;
  const { investigation_id } = req.body;

  try {
    const test_parameters = await knex("investigation_reports")
      .leftJoin(
        "test_parameters",
        "investigation_reports.parameter_id",
        "test_parameters.id"
      )

      .where("investigation_reports.patient_id", id)
      .where("investigation_reports.investigation_id", investigation_id)

      .select(
        "test_parameters.id",
        "test_parameters.name",
        "test_parameters.normal_range",
        "test_parameters.units",
        "investigation_reports.value",
        "investigation_reports.created_at"
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


    if (!investigationId) {
      throw new Error("Missing investigation_id in payload");
    }

    if (!patientId) {
      throw new Error("Missing investigation_id in payload");
    }

    const investionData = await knex("investigation")
      .where({ id: investigationId })
      .first();

    await knex("request_investigation")
      .where({ test_name: investionData.test_name })
      .where({ patient_id: patientId })
      .update({ status: "complete" });

    const resultData = payload.map((param) => ({
      investigation_id: param.investigation_id,
      parameter_id: param.parameter_id,
      patient_id: param.patient_id,
      value: param.value,
    }));

    await knex("investigation_reports").insert(resultData);

    // ✅ Fetch who requested it
    const requestRow = await knex("request_investigation")
      .where({ test_name: investionData.test_name, patient_id: patientId })
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

    res.status(201).json({
      message: "Results submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting results:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// save fuild balance function
exports.saveFluidBalance = async (req, res) => {
  const { patient_id, observations_by, fluid_intake, fluid_output } = req.body;

  try {
    // Step 1: Insert and get inserted ID
    const [insertId] = await knex("fluid_balance").insert({
      patient_id,
      observations_by,
      fluid_intake,
      fluid_output,
    });

    // Step 2: Fetch the saved row with timestamp
    const savedRow = await knex("fluid_balance").where("id", insertId).first();

    // ✅ Return the actual inserted row
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

    if (!patient_id) {
      return res.status(400).json({ error: "Missing patient_id" });
    }

    const fluidData = await knex("fluid_balance")
      .where("patient_id", patient_id)
      .orderBy("created_at", "desc");

    // ✅ Always return 200, even if no data found
    return res.status(200).json(fluidData);
  } catch (error) {
    console.error("Error in getFluidBalanceByPatientId:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.saveParamters = async (req, res) => {
  const { title, normal_range, units, category, field_type, test_name } =
    req.body;

  if (
    !title ||
    !normal_range ||
    !units ||
    !category ||
    !field_type ||
    !test_name
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
// exports.getAllTypeRequestInvestigation = async (req, res) => {
//   try {
//     const request_investigation = await knex("request_investigation")
//       .leftJoin(
//         "patient_records",
//         "request_investigation.patient_id",
//         "patient_records.id"
//       )
//       .select(
//         "request_investigation.*",
//         "request_investigation.category as investCategory",
//         "patient_records.name",
//         "patient_records.date_of_birth",
//         "patient_records.gender",
//         "patient_records.category"
//       )
//       .orderBy("request_investigation.created_at", "desc");

//     return res.status(200).json(request_investigation);
//   } catch (error) {
//     console.error("Error fetching investigations:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch investigations",
//     });
//   }
// };

exports.getAllTypeRequestInvestigation = async (req, res) => {
  try {
    const userEmail = req.user.email; // From decoded token
    const user = await knex("users").where("uemail", userEmail).first();

    // If Superadmin, return all investigations
    if (user.role === "Superadmin") {
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



