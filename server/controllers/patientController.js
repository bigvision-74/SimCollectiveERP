const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
require("dotenv").config();
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { getIO } = require("../websocket");
const axios = require("axios");
const { Parser } = require("json2csv");
const admin = require("firebase-admin");
const { secondaryApp } = require("../firebase");

exports.createPatient = async (req, res) => {
  const patientData = req.body;

  try {
    if (!patientData.name || !patientData.dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Name, date of birth, are required",
      });
    }

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

    const newPatient = {
      name: patientData.name,
      date_of_birth: patientData.dateOfBirth,
      ageGroup: patientData.ageGroup,
      gender: patientData.gender || null,
      type: patientData.type || null,
      category: patientData.speciality || null,
      ethnicity: patientData.ethnicity || null,
      nationality: patientData.nationality || null,
      height: patientData.height || null,
      weight: patientData.weight || null,
      email: patientData.email || null,
      phone: patientData.phone || null,
      scenario_location: patientData.department || null,
      room_type: patientData.room || null,
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
      allergies: patientData.allergies,
      medical_history: patientData.LifetimeMedicalHistory,
    };

    const org = await knex("organisations")
      .where({ id: patientData.organisation_id })
      .first();

    const result = await knex("patient_records").insert(newPatient);
    const patientDbId = result[0];

    try {
      await knex("activity_logs").insert({
        user_id: patientData.addedBy,
        action_type: "CREATE",
        entity_name: "Patient",
        entity_id: patientDbId,
        details: JSON.stringify({
          data: {
            name: newPatient.name,
            uemail: newPatient.email,
            date_of_birth: newPatient.date_of_birth,
            gender: newPatient.gender,
            organisation_id: org ? org.name : "N/A",
            status: newPatient.status,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for createPatient:", logError);
    }

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
        "categorytest",
        "investigation_reports.investigation_id",
        "categorytest.id"
      )
      .leftJoin("category", "category.id", "categorytest.category")
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
        "categorytest.category",
        "categorytest.name",
      ])
      .select(
        "investigation_reports.investigation_id",
        "investigation_reports.updated_at",
        knex.raw("MAX(investigation_reports.id) as latest_report_id"),
        knex.raw("MAX(investigation_reports.value) as value"),
        "patient_records.name",
        "patient_records.id as patient_id",
        "categorytest.category as category_id",
        "categorytest.name",
        "category.name as category"
      )
      .orderBy("latest_report_id", "desc");

    res.status(200).send(userReports);
  } catch (error) {
    console.log("Error getting patient Records", error);
    res.status(500).send({ message: "Error getting patient Records" });
  }
};

exports.deletePatients = async (req, res) => {
  try {
    const { ids, performerId } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        error: "Invalid request: IDs must be provided as an array.",
      });
    }

    const idsToDelete = ids;

    const patientsToLog = await knex("patient_records")
      .whereIn("id", idsToDelete)
      .select("id", "name", "email");

    if (patientsToLog.length === 0) {
      return res.status(404).json({
        message: "No patients found with the provided IDs.",
      });
    }

    const result = await knex("patient_records")
      .whereIn("id", idsToDelete)
      .update({ deleted_at: "deleted" });

    if (result > 0) {
      try {
        const logEntries = patientsToLog.map((patient) => ({
          user_id: performerId || 1,
          action_type: "DELETE",
          entity_name: "Patient",
          entity_id: patient.id,
          details: JSON.stringify({
            data: {
              name: patient.name,
              uemail: patient.email || "N/A",
            },
          }),
          created_at: new Date(),
        }));

        if (logEntries.length > 0) {
          await knex("activity_logs").insert(logEntries);
        }
      } catch (logError) {
        console.error("Activity log failed for deletePatients:", logError);
      }
    }

    return res.status(200).json({
      message: "Patients deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting patients:", error);
    return res.status(500).json({
      message: "An error occurred while deleting patients.",
    });
  }
};

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
        "date_of_birth",
        "gender",
        "type",
        "ageGroup",
        "patient_thumbnail",
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
        "team_traits as teamTraits",
        "status",
        "allergies"
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

exports.updatePatient = async (req, res) => {
  const { id } = req.params;
  const patientData = req.body;

  try {
    if (!patientData.name || !patientData.dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Name and Date of Birth are required",
      });
    }

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
      ageGroup: patientData.ageGroup || null,
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
      organisation_id: patientData.organization_id || null,
      status: patientData.status,
      allergies: patientData.allergies,
      medical_history: patientData.LifetimeMedicalHistory,
    };

    const changes = {};
    const fieldsToTrack = [
      "name",
      "email",
      "status",
      "gender",
      "ageGroup",
      "phone",
      "type",
      "category",
      "medical_history",
    ];

    fieldsToTrack.forEach((field) => {
      let oldValue = existingPatient[field];
      let newValue = updatedPatient[field];

      if ((oldValue || "") !== (newValue || "")) {
        changes[field] = {
          old: oldValue || "N/A",
          new: newValue || "N/A",
        };
      }
    });

    await knex("patient_records").where({ id }).update(updatedPatient);

    try {
      if (Object.keys(changes).length > 0) {
        const performerId = patientData.addedBy || 1;

        await knex("activity_logs").insert({
          user_id: performerId,
          action_type: "UPDATE",
          entity_name: "Patient",
          entity_id: id,
          details: JSON.stringify({ changes }),
          created_at: new Date(),
        });
      }
    } catch (logError) {
      console.error("Activity log failed for updatePatient:", logError);
    }

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

exports.addPatientNote = async (req, res) => {
  const {
    patient_id,
    sessionId,
    title,
    content,
    doctor_id,
    organisation_id,
    report_id,
    attachments,
  } = req.body;
  const io = getIO();

  if (!patient_id || !title || !content) {
    return res.status(400).json({
      success: false,
      message: "patient_id, title, and content are required",
    });
  }

  try {
    const [newNoteId] = await knex("patient_notes").insert({
      patient_id,
      doctor_id: doctor_id || null,
      organisation_id: organisation_id || null,
      title,
      content,
      attachments,
      report_id: report_id || null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });

    try {
      await knex("activity_logs").insert({
        user_id: doctor_id || 1,
        action_type: "CREATE",
        entity_name: "Patient Note",
        entity_id: newNoteId,
        details: JSON.stringify({
          data: {
            patient_id: patient_id,
            title: title,
            content: content,
            organisation_id: organisation_id,
            report_id: report_id || "N/A",
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for addPatientNote:", logError);
    }

    if (!sessionId || Number(sessionId) === 0) {
      return res.status(201).json({
        success: true,
        message: "Patient note added successfully",
        data: {
          id: newNoteId,
          patient_id,
          doctor_id,
          organisation_id,
          title,
          content,
          report_id: report_id || null,
          created_at: new Date().toISOString(),
        },
      });
    }

    const socketData = {
      device_type: "App",
      notes: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id) {
      const sessionDetails = await knex("session")
        .where({ id: sessionId })
        .select("participants", "patient");

      if (sessionDetails.length > 0) {
        const userIds = sessionDetails.flatMap((session) => {
          const participants =
            typeof session.participants === "string"
              ? JSON.parse(session.participants)
              : session.participants;

          return participants.filter((p) => p.role === "User").map((p) => p.id);
        });

        if (userIds.length > 0) {
          const users = await knex("users").whereIn("id", userIds);

          if (sessionDetails[0].patient == patient_id) {
            for (const user of users) {
              if (user?.fcm_token) {
                const message = {
                  notification: {
                    title: "New Note Added",
                    body: `A new note has been added for patient ${patient_id}.`,
                  },
                  token: user.fcm_token,
                  data: {
                    sessionId: String(sessionId),
                    patientId: String(patient_id),
                    noteId: String(newNoteId),
                    type: "note_added",
                  },
                };

                try {
                  await secondaryApp.messaging().send(message);
                } catch (notifErr) {
                  console.error(
                    `❌ Error sending FCM notification to user ${user.id}:`,
                    notifErr
                  );
                }
              }
            }
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Patient note added and notification sent successfully",
      data: {
        id: newNoteId,
        patient_id,
        doctor_id,
        organisation_id,
        title,
        content,
        report_id: report_id || null,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error adding patient note:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

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
        "pn.attachments",
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

exports.updatePatientNote = async (req, res) => {
  const noteId = req.params.id;
  // Added 'attachments' to the destructured body
  const { title, content, attachments, sessionId, addedBy } = req.body;
  const io = getIO();

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Title and content are required",
    });
  }

  try {
    // Fetch old data for comparison before updating
    const oldNote = await knex("patient_notes").where({ id: noteId }).first();

    if (!oldNote) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Include attachments in the update object
    const updated = await knex("patient_notes")
      .where({ id: noteId })
      .update({
        title,
        content,
        attachments: attachments || oldNote.attachments, // Keep old if new not provided
        updated_at: new Date(),
      });

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update note",
      });
    }

    // --- ACTIVITY LOG START ---
    try {
      const changes = {};

      if (oldNote.title !== title) {
        changes.title = { old: oldNote.title, new: title };
      }

      if (oldNote.content !== content) {
        changes.content = { old: oldNote.content, new: content };
      }

      // Logic to detect if the file/attachments changed
      // We compare them as strings to detect changes in JSON/Arrays
      if (JSON.stringify(oldNote.attachments) !== JSON.stringify(attachments)) {
        changes.attachments = {
          old: oldNote.attachments ? "Previous File(s)" : "No File",
          new: attachments ? "Updated File(s)" : "Removed File",
        };
      }

      if (Object.keys(changes).length > 0) {
        await knex("activity_logs").insert({
          user_id: addedBy || 1,
          action_type: "UPDATE",
          entity_name: "Patient Note",
          entity_id: noteId,
          details: JSON.stringify({ changes }),
          created_at: new Date(),
        });
      }
    } catch (logError) {
      console.error("Activity log failed for updatePatientNote:", logError);
    }

    const updatedNote = await knex("patient_notes")
      .where({ id: noteId })
      .first();

    const socketData = {
      device_type: "App",
      notes: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (updatedNote.organisation_id && sessionId) {
      const users = await knex("users").where({
        organisation_id: updatedNote.organisation_id,
        role: "User",
      });
      const sessionDetails = await knex("session")
        .where({ id: sessionId })
        .select("participants", "patient");
      if (sessionDetails[0].patient == updatedNote.patient_id) {
        for (const user of users) {
          if (user && user.fcm_token) {
            const token = user.fcm_token;

            const message = {
              notification: {
                title: "Note Updated",
                body: `A note has been updated for patient ${updatedNote.patient_id}.`,
              },
              token: token,
              data: {
                sessionId: String(sessionId),
                patientId: String(updatedNote.patient_id),
                noteId: String(noteId),
                type: "note_updated",
              },
            };

            try {
              await secondaryApp.messaging().send(message);
            } catch (notifErr) {
              console.error(
                `❌ Error sending FCM notification to user ${user.id}:`,
                notifErr
              );
            }
          }
        }
      }
    }

    return res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error updating patient note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update note",
    });
  }
};

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
    mews2,
    pews2,
    observations_by,
    organisation_id,
    sessionId,
    time_stamp,
  } = req.body;

  const date = new Date(time_stamp);

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
      pews2,
      mews2,
      observations_by,
      organisation_id,
      time_stamp: date,
    });

    const inserted = await knex("observations").where({ id }).first();

    try {
      await knex("activity_logs").insert({
        user_id: observations_by || 1,
        action_type: "CREATE",
        entity_name: "Observation",
        entity_id: id,
        details: JSON.stringify({
          data: {
            patient_id: patient_id,
            respiratory_rate: respiratoryRate,
            o2_sats: o2Sats,
            blood_pressure: bloodPressure,
            pulse: pulse,
            temperature: temperature,
            news2_score: news2Score,
            consciousness: consciousness,
            time_stamp: date.toLocaleString(),
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for addObservations:", logError);
    }

    const socketData = {
      device_type: "App",
      observations: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id && sessionId) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "New Observation Added",
              body: `A Observation has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "observations",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    res.status(201).json(inserted);
  } catch (error) {
    console.error("Error adding Observations :", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateObservations = async (req, res) => {
  const io = getIO();
  const {
    id,
    patient_id,
    respiratoryRate,
    o2Sats,
    oxygenDelivery,
    bloodPressure,
    pulse,
    consciousness,
    temperature,
    news2Score,
    mews2,
    pews2,
    observations_by,
    organisation_id,
    sessionId,
    time_stamp,
  } = req.body;

  try {
    // Fetch old data for comparison before updating
    const oldObs = await knex("observations").where({ id: id }).first();

    if (!oldObs) {
      return res.status(404).json({ message: "Observation not found" });
    }

    const updateData = {
      patient_id,
      respiratory_rate: respiratoryRate,
      o2_sats: o2Sats,
      oxygen_delivery: oxygenDelivery,
      blood_pressure: bloodPressure,
      pulse,
      consciousness,
      temperature,
      news2_score: news2Score,
      pews2,
      mews2,
      observations_by,
      organisation_id,
      time_stamp,
    };

    // Calculate changes for Activity Log
    const changes = {};
    const fieldMapping = [
      { key: "respiratory_rate", label: "respiratoryRate" },
      { key: "o2_sats", label: "o2Sats" },
      { key: "blood_pressure", label: "bloodPressure" },
      { key: "pulse", label: "pulse" },
      { key: "temperature", label: "temperature" },
      { key: "news2_score", label: "news2Score" },
      { key: "consciousness", label: "consciousness" },
    ];

    fieldMapping.forEach((field) => {
      const oldValue = oldObs[field.key];
      const newValue = updateData[field.key];

      if (String(oldValue ?? "") !== String(newValue ?? "")) {
        changes[field.key] = {
          old: oldValue ?? "N/A",
          new: newValue ?? "N/A",
        };
      }
    });

    const updatedCount = await knex("observations")
      .where({ id: id })
      .update(updateData);

    try {
      if (Object.keys(changes).length > 0) {
        await knex("activity_logs").insert({
          user_id: observations_by || 1,
          action_type: "UPDATE",
          entity_name: "Observation",
          entity_id: id,
          details: JSON.stringify({ changes }),
          created_at: new Date(),
        });
      }
    } catch (logError) {
      console.error("Activity log failed for updateObservations:", logError);
    }

    const socketData = {
      device_type: "App",
      observations: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id && sessionId) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Observation updated",
              body: `A Observation has been updated for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "observations",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    res.status(200).json({ success: true, message: "Observation updated" });
  } catch (error) {
    console.error("Error updating Observations :", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
        "o.pews2",
        "o.mews2",
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

exports.getObservationsByTableId = async (req, res) => {
  const obsId = req.params.obsId;

  if (!obsId || isNaN(Number(obsId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid observation ID",
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
        "o.observations_by"
      )
      .where("o.id", obsId)
      .first();

    const observations = await query;

    res.status(200).json(observations);
  } catch (error) {
    console.error("Error fetching observations:", error);
    res.status(500).json({ message: "Failed to fetch observations" });
  }
};

exports.getFluidByTableId = async (req, res) => {
  const FluidId = req.params.FluidId;

  if (!FluidId || isNaN(Number(FluidId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid Fluid ID",
    });
  }

  try {
    const query = knex("fluid_balance")
      .select(
        "id",
        "patient_id",
        "type",
        "fluid_intake",
        "fluid_output",
        "units",
        "duration",
        "route",
        "notes",
        "created_at",
        "observations_by",
        knex.raw(
          "DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i') as formatted_timestamp"
        )
      )
      .where("id", FluidId)
      .first();

    const Fluids = await query;

    res.status(200).json(Fluids);
  } catch (error) {
    console.error("Error fetching Fluids:", error);
    res.status(500).json({ message: "Failed to fetch Fluids" });
  }
};

exports.getFluidBalanceById = async (req, res) => {
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
    const query = knex("fluid_balance")
      .select(
        "fluid_balance.id",
        "fluid_balance.patient_id",
        "fluid_balance.type",
        "fluid_balance.fluid_intake",
        "fluid_balance.fluid_output",
        "fluid_balance.units",
        "fluid_balance.duration",
        "fluid_balance.route",
        "fluid_balance.notes",
        "fluid_balance.created_at",
        "fluid_balance.observations_by",
        "u.fname",
        "u.lname",
        knex.raw(
          "DATE_FORMAT(fluid_balance.timestamp, '%Y-%m-%d %H:%i') as formatted_timestamp"
        )
      )
      .leftJoin("users as u", "fluid_balance.observations_by", "u.id")
      .where("fluid_balance.patient_id", patientId)
      .orderBy("fluid_balance.created_at", "desc");

    if (role !== "Superadmin") {
      query.andWhere("fluid_balance.organisation_id", orgId);
    }

    const fluid_balance = await query;

    res.status(200).json(fluid_balance);
  } catch (error) {
    console.error("Error fetching fluid:", error);
    res.status(500).json({ message: "Failed to fetch fluid" });
  }
};

exports.getFluidBalanceById1 = async (req, res) => {
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
    const query = knex("fluid_balance")
      .select(
        knex.raw(`
          DATE_FORMAT(fluid_balance.timestamp, '%Y-%m-%d %H:00') AS hour_slot,
          SUM(fluid_balance.fluid_intake) AS total_intake,
          SUM(fluid_balance.fluid_output) AS total_output
        `)
      )
      .where("fluid_balance.patient_id", patientId)
      .groupByRaw("DATE_FORMAT(fluid_balance.timestamp, '%Y-%m-%d %H')")
      .orderByRaw("DATE_FORMAT(fluid_balance.timestamp, '%Y-%m-%d %H') ASC");

    if (role !== "Superadmin") {
      query.andWhere("fluid_balance.organisation_id", orgId);
    }

    const hourlySummary = await query;

    res.status(200).json({
      success: true,
      data: hourlySummary,
    });
  } catch (error) {
    console.error("Error fetching hourly fluid balance:", error);
    res.status(500).json({ message: "Failed to fetch hourly fluid balance" });
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
  const id = req.params.id; // fix destructuring
  try {
    const investigations = await knex("categorytest")
      .leftJoin("users", "users.id", "=", "categorytest.addedBy")
      .select("categorytest.*", "users.organisation_id", "users.role")
      .where("categorytest.category", id); // specify table.column

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
    let insertedCount = 0;
    let patient_id;
    let organisation_id;

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
      organisation_id = item.organisation_id;

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
          `Duplicate pending request for test "${item.test_name}" (entry ${
            index + 1
          })`
        );
        continue;
      }

      // 1. Insert individual investigation
      const [insertedId] = await knex("request_investigation").insert({
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

      insertedCount++;

      // --- ACTIVITY LOG START ---
      try {
        await knex("activity_logs").insert({
          user_id: item.request_by || 1,
          action_type: "CREATE",
          entity_name: "Investigation Request",
          entity_id: insertedId,
          details: JSON.stringify({
            data: {
              test_name: item.test_name,
              category: item.category,
              patient_id: item.patient_id,
              organisation_id: item.organisation_id,
              session_id: sessionId,
              status: "pending",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error(
          "Activity log failed for request investigation:",
          logError
        );
      }
      // --- ACTIVITY LOG END ---
    }

    if (insertedCount === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No investigations inserted due to duplicates or validation errors.",
        insertedCount: 0,
        warnings: errors,
      });
    }

    const socketData = {
      device_type: "App",
      request_investigation: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "New Investigation Request Added",
              body: `A new Investigation Request has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "request_investigation",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Investigations saved successfully",
      insertedCount: insertedCount,
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
        "request_investigation.id",
        "categorytest.id as category_id",
        "request_investigation.patient_id as patientId",
        "request_investigation.request_by as requestedBy",
        "request_investigation.category",
        "request_investigation.test_name as testName",
        "request_investigation.status",
        knex.raw(
          "DATE_FORMAT(request_investigation.created_at, '%Y-%m-%d %H:%i:%s') as createdAt"
        )
      )
      .leftJoin(
        "categorytest",
        "request_investigation.test_name",
        "categorytest.name"
      )
      .where("request_investigation.patient_id", patientId)
      .andWhere("request_investigation.status", "pending")
      .orderBy("request_investigation.created_at", "desc");

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
      // .andWhere(function () {
      //   this.whereNull("deleted_at").orWhere("deleted_at", "");
      // })
      .andWhere(function () {
        this.where("deleted_at", "<>", "deleted")
          .orWhereNull("deleted_at")
          .orWhere("deleted_at", "");
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
  let {
    gender,
    room,
    speciality,
    condition,
    department,
    count,
    ageGroup,
    nationality,
    ethnicity,
  } = req.body;

  if (
    !gender ||
    !room ||
    !speciality ||
    !condition ||
    !department ||
    !ageGroup ||
    !nationality ||
    !ethnicity
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required fields: gender, ageGroup, room, speciality, condition, department, nationality, ethnicity",
    });
  }

  count = Math.max(1, Math.min(parseInt(count) || 1, 5));

  try {
    const systemPrompt = `
You are a medical AI that generates fictional but realistic patient records for training simulations.
You will receive patient criteria such as gender, room type, department, specialty, condition, age group, nationality, and ethnicity.
Return ONLY a JSON array of patient objects (no extra text).

Ensure that:
  - Nationality and ethnicity are consistent and match the given inputs.
  - Names, addresses, and cultural details align with the provided nationality.
  - dateOfBirth must NOT be a date — instead it must contain the patient’s AGE as a number (e.g., "34").
  - Gender is respected.
  - All data looks medically and demographically realistic.

Each patient object must contain:
  - name: realistic full name matching gender
  - dateOfBirth: a numeric age (e.g., "45") matching the age group
  - gender
  - email: realistic and valid email format
  - phone: 10-digit US phone number (e.g., 5551234567)
  - height (in cm), weight (in kg)
  - address: realistic street address
  - roomType: use the provided room type
  - scenarioLocation: use the department
  - category: use the specialty
  - ethnicity
  - nationality
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

  - socialEconomicHistory: unique for each patient.
  - familyMedicalHistory
  - allergies
  - lifetimeMedicalHistory
  - lifestyleAndHomeSituation

Return only valid JSON.
`;

    let ageRange = "";
    switch (ageGroup) {
      case "child":
        ageRange = "0-12 years old";
        break;
      case "teen":
        ageRange = "13-19 years old";
        break;
      case "adult":
        ageRange = "20-59 years old";
        break;
      case "senior":
        ageRange = "60+ years old";
        break;
      default:
        ageRange = "any age";
    }

    const userPrompt = `Generate ${count} patient case(s) with:
      - Gender: ${gender}
      - Age Range: ${ageRange}
      - Room Type: ${room}
      - Specialty: ${speciality}
      - Condition: ${condition}
      - Department: ${department}
      - Nationality: ${nationality}
      - Ethnicity: ${ethnicity}

      Ensure consistency between nationality, ethnicity, and cultural context.
      Make sure all generated patients are medically and demographically realistic.`;

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

exports.saveGeneratedPatients = async (req, res) => {
  try {
    const patients = req.body;
    if (!Array.isArray(patients) || patients.length === 0) {
      return res.status(400).json({ message: "Invalid data." });
    }

    const toString = (val) => (Array.isArray(val) ? val.join(", ") : val || "");
    const performerId = patients[0]?.addedBy || 1; // Capture the user who initiated the generation

    const formatted = patients.map((p) => ({
      organisation_id: p.organisationId || null,
      name: p.name,
      email: p.email,
      phone: p.phone,
      date_of_birth: p.dateOfBirth,
      gender: p.gender,
      ageGroup: p.ageGroup || "",
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
      medical_equipment: toString(p.medicalEquipment),
      pharmaceuticals: toString(p.pharmaceuticals),
      diagnostic_equipment: toString(p.diagnostic_equipment),
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
      status: "completed",
      allergies: p.allergies,
      medical_history: p.LifetimeMedicalHistory,
    }));

    // Perform insertions individually to capture IDs for activity logs
    for (const patient of formatted) {
      const [patientId] = await knex("patient_records").insert(patient);

      try {
        await knex("activity_logs").insert({
          user_id: performerId,
          action_type: "CREATE",
          entity_name: "Patient",
          entity_id: patientId,
          details: JSON.stringify({
            data: {
              name: patient.name,
              uemail: patient.email || "N/A",
              date_of_birth: patient.date_of_birth,
              gender: patient.gender,
              status: patient.status,
              organisation_id: patient.organisation_id,
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for generated patient:", logError);
      }
      // --- ACTIVITY LOG END ---
    }

    return res.status(201).json({
      success: true,
      message: "Patients generated and saved successfully",
    });
  } catch (error) {
    console.error("Error creating patients:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create patients",
    });
  }
};

exports.addInvestigation = async (req, res) => {
  const { category, test_name, investigation_added_by, category_added_by } =
    req.body;

  if (!category || !test_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let categoryId;
    const performerId = investigation_added_by || category_added_by || 1;

    if (category_added_by) {
      // 1. Insert new category
      const status = category_added_by == 1 ? "approved" : "requested";
      [categoryId] = await knex("category").insert({
        addedBy: category_added_by,
        name: category,
        status: status,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });

      // --- ACTIVITY LOG: Category Creation ---
      try {
        await knex("activity_logs").insert({
          user_id: performerId,
          action_type: "CREATE",
          entity_name: "Investigation Category",
          entity_id: categoryId,
          details: JSON.stringify({
            data: {
              category_name: category,
              status: status,
            },
          }),
          created_at: new Date(),
        });
      } catch (logErr) {
        console.error("Log failed for category creation:", logErr);
      }
    } else {
      // Fetch existing category
      const categoryObj = await knex("category")
        .where({ name: category })
        .select("id")
        .first();

      if (!categoryObj) {
        return res.status(404).json({ message: "Category not found" });
      }

      categoryId = categoryObj.id;
    }

    // 2. Insert investigation/test
    const invStatus = investigation_added_by == 1 ? "approved" : "requested";
    const [investigationId] = await knex("categorytest").insert({
      addedBy: investigation_added_by,
      category: categoryId,
      name: test_name,
      status: invStatus,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });

    // --- ACTIVITY LOG: Investigation Creation ---
    try {
      await knex("activity_logs").insert({
        user_id: performerId,
        action_type: "CREATE",
        entity_name: "Investigation",
        entity_id: investigationId,
        details: JSON.stringify({
          data: {
            test_name: test_name,
            category: category,
            status: invStatus,
          },
        }),
        created_at: new Date(),
      });
    } catch (logErr) {
      console.error("Log failed for investigation creation:", logErr);
    }

    res.status(201).json({
      categoryId,
      investigationId,
      category,
      test_name,
    });
  } catch (error) {
    console.error("Error adding investigation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const categories = await knex("category")
      .where("status", "!=", "requested")
      .orWhereNull("status");
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching investigation categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

exports.getInvestigationsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const investigations = await knex("categorytest")
      .where({ category: category_id })
      .andWhere("status", "!=", "requested")
      .select("id", "name");
    res.json(investigations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
      .leftJoin("categorytest as investigation", function () {
        this.on(
          knex.raw("LOWER(TRIM(request_investigation.test_name))"),
          "=",
          knex.raw("LOWER(TRIM(investigation.name))")
        );
      })
      .leftJoin("users", "request_investigation.request_by", "users.id")
      .leftJoin("session", "request_investigation.session_id", "session.id")
      .whereNotNull("investigation.id")
      .whereExists(function () {
        this.select(1)
          .from("testparameters")
          .whereRaw("testparameters.investigation_id = investigation.id")
          .andWhere(function () {
            this.where("testparameters.status", "!=", "requested").orWhereNull(
              "testparameters.status"
            );
          });
      })
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

    return res.status(200).json({
      success: true,
      count: request_investigation.length,
      data: request_investigation,
    });
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
      error: error.message,
    });
  }
};

exports.getInvestigationParams = async (req, res) => {
  const { id } = req.params;

  try {
    const test_parameters = await knex("testparameters")
      .leftJoin(
        "categorytest",
        "testparameters.investigation_id",
        "categorytest.id"
      )
      .leftJoin("users", "users.id", "testparameters.addedBy")
      .where({ "testparameters.investigation_id": id })
      .andWhere((builder) => {
        builder
          .where("testparameters.status", "!=", "requested")
          .orWhereNull("testparameters.status");
      })
      .select(
        "testparameters.*",
        "testparameters.id as parameter_id",
        "categorytest.category as category_name",
        "categorytest.id as investigation_id",
        "categorytest.name as investigation_name",

        "users.organisation_id",
        "users.role"
      )
      .orderBy("testparameters.created_at", "desc");

    return res.status(200).json({
      success: true,
      count: test_parameters.length,
      data: test_parameters,
    });
  } catch (error) {
    console.error("Error fetching investigation params:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
      error: error.message,
    });
  }
};

exports.getInvestigationReports = async (req, res) => {
  const { patientId, investigationId, orgId } = req.params;
  const { role } = req.query;

  try {
    let query = knex("investigation_reports")
      .leftJoin(
        "testparameters",
        "investigation_reports.parameter_id",
        "testparameters.id"
      )
      .leftJoin("users", "investigation_reports.submitted_by", "users.id")
      .where("investigation_reports.patient_id", patientId)
      .where("investigation_reports.investigation_id", investigationId);

    if (role !== "Superadmin") {
      query = query.andWhere("investigation_reports.organisation_id", orgId);
    }

    // Fetch test parameter results
    const test_parameters = await query
      .select(
        "testparameters.id",
        "testparameters.name",
        "testparameters.normal_range",
        "testparameters.units",
        "testparameters.field_type",
        "investigation_reports.value",
        "investigation_reports.created_at",
        "investigation_reports.scheduled_date",
        "investigation_reports.submitted_by",
        "investigation_reports.request_investigation_id",
        "users.fname as submitted_by_fname",
        "users.lname as submitted_by_lname"
      )
      .orderBy("testparameters.id", "asc");

    const requestIds = test_parameters
      .map((tp) => tp.request_investigation_id)
      .filter((id) => id !== null);

    let notes = [];
    if (requestIds.length > 0) {
      notes = await knex("reportnotes")
        .leftJoin("users", "reportnotes.addedBy", "users.id")
        .whereIn("reportId", requestIds)
        .select(
          "reportnotes.*",
          "users.fname",
          "users.lname",
          "users.user_thumbnail"
        );
    }

    return res.status(200).json({
      success: true,
      test_parameters,
      notes,
    });
  } catch (error) {
    console.error("Error fetching investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch investigations",
    });
  }
};

exports.submitInvestigationResults = async (req, res) => {
  const { payload, note } = req.body;

  if (!Array.isArray(payload) || !payload.length) {
    return res.status(400).json({ message: "Missing or invalid payload" });
  }

  try {
    const requestInvestigationId = payload[0]?.request_investigation_id;
    const investigationId = payload[0]?.investigation_id;
    const patientId = payload[0]?.patient_id;
    const submittedBy = payload[0]?.submitted_by;
    const sessionId = payload[0]?.sessionId;
    const organisationId = payload[0]?.organisation_id;
    const io = getIO();

    if (!requestInvestigationId) {
      throw new Error("Missing request_investigation_id in payload");
    }

    const updateCount = await knex("request_investigation")
      .where({ id: requestInvestigationId })
      .update({ status: "complete" });

    const requestRow = await knex("request_investigation")
      .where({ id: requestInvestigationId })
      .first();
    console.log(
      requestInvestigationId,
      "requestInvestigationIdrequestInvestigationId"
    );

    const testName = requestRow?.test_name || "Investigation";

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

    const parameters = await knex("investigation_reports")
      .leftJoin(
        "testparameters",
        "investigation_reports.parameter_id",
        "=",
        "testparameters.id"
      )
      .select(
        "testparameters.name as parameter_name",
        "testparameters.normal_range",
        "testparameters.units",
        "investigation_reports.value"
      )
      .where(
        "investigation_reports.request_investigation_id",
        String(requestInvestigationId)
      );

    // console.log(parameters, "parameters");
    if (note != "null" && note != "") {
      const notesData = {
        reportId: requestInvestigationId,
        note: note,
        addedBy: submittedBy,
        created_at: new Date(),
        updated_at: new Date(),
      };
      await knex("reportnotes").insert(notesData);
    }

    // --- ACTIVITY LOG START ---
    try {
      await knex("activity_logs").insert({
        user_id: submittedBy || 1,
        action_type: "CREATE",
        entity_name: "Investigation Report",
        entity_id: requestInvestigationId,
        details: JSON.stringify({
          data: {
            test_name: testName,
            patient_id: patientId,
            parameters_submitted: payload.length,
            note_added: note != "null" && note != "" ? "Yes" : "No",
            organisation_id: organisationId,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error(
        "Activity log failed for submitInvestigationResults:",
        logError
      );
    }
    // --- ACTIVITY LOG END ---

    const requestedBy = requestRow?.request_by;

    if (requestedBy) {
      await knex("notifications").insert({
        notify_by: submittedBy,
        notify_to: requestedBy,
        title: "New Investigation Report Request",
        message: `New investigation results for ${testName} have been submitted for patient.`,
        status: "unseen",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const socketData = {
      device_type: "App",
      investigation_reports: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (payload[0]?.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: payload[0]?.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;
          const message = {
            notification: {
              title: "New Investigation Reports Submitted",
              body: `A new Investigation Reports has been added for patient ${patientId}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patientId),
              type: "investigation_reports",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error("FCM Error", notifErr);
          }
        }
      }
    }

    res.status(201).json({
      message: "Results submitted successfully",
      body: parameters,
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
    sessionId,
    type,
    units,
    duration,
    route,
    timestamp,
    notes,
  } = req.body;

  const io = getIO();

  try {
    const [insertId] = await knex("fluid_balance").insert({
      patient_id,
      observations_by,
      organisation_id,
      fluid_intake,
      type,
      units,
      duration,
      route,
      timestamp,
      notes,
    });

    const savedRow = await knex("fluid_balance").where("id", insertId).first();

    try {
      await knex("activity_logs").insert({
        user_id: observations_by || 1,
        action_type: "CREATE",
        entity_name: "Fluid Balance",
        entity_id: insertId,
        details: JSON.stringify({
          data: {
            patient_id: patient_id,
            fluid_intake: fluid_intake,
            type: type,
            units: units,
            route: route,
            duration: duration,
            timestamp: timestamp,
            notes: notes,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for saveFluidBalance:", logError);
    }

    const socketData = {
      device_type: "App",
      fluid_balance: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id && sessionId) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "New Fluid Balance Added",
              body: `A Fluid Balance has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "fluid_balance",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    res.status(200).json(savedRow);
  } catch (error) {
    console.error("Error saving fluid balance:", error);
    res.status(500).json({ message: "Failed to save fluid balance" });
  }
};

exports.updateFluidBalance = async (req, res) => {
  const {
    id,
    patient_id,
    observations_by,
    organisation_id,
    fluid_intake,
    sessionId,
    type,
    units,
    duration,
    route,
    formatted_timestamp,
    notes,
    performerId,
  } = req.body;
  const io = getIO();

  try {
    const oldFluid = await knex("fluid_balance").where({ id: id }).first();

    if (!oldFluid) {
      return res
        .status(404)
        .json({ message: "Fluid Balance record not found" });
    }

    console.log(req.body);

    const updateData = {
      patient_id,
      observations_by,
      organisation_id,
      fluid_intake,
      type,
      units,
      duration,
      route,
      timestamp: formatted_timestamp,
      notes,
    };

    const changes = {};
    const fieldsToTrack = [
      "fluid_intake",
      "type",
      "units",
      "duration",
      "route",
      "timestamp",
      "notes",
    ];

    fieldsToTrack.forEach((field) => {
      const oldValue = oldFluid[field];
      const newValue = updateData[field];

      if (String(oldValue ?? "") !== String(newValue ?? "")) {
        changes[field] = {
          old: oldValue ?? "N/A",
          new: newValue ?? "N/A",
        };
      }
    });

    await knex("fluid_balance").where({ id: id }).update(updateData);

    try {
      if (Object.keys(changes).length > 0) {
        await knex("activity_logs").insert({
          user_id: performerId || 1,
          action_type: "UPDATE",
          entity_name: "Fluid Balance",
          entity_id: id,
          details: JSON.stringify({ changes }),
          created_at: new Date(),
        });
      }
    } catch (logError) {
      console.error("Activity log failed for updateFluidBalance:", logError);
    }

    const savedRow = await knex("fluid_balance").where("id", id).first();

    const socketData = {
      device_type: "App",
      fluid_balance: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id && sessionId) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Fluid Balance Updated",
              body: `A Fluid Balance has been updated for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "fluid_balance",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    res.status(200).json(savedRow);
  } catch (error) {
    console.error("Error updating fluid balance:", error);
    res.status(500).json({ message: "Failed to update fluid balance" });
  }
};

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

    // if (role !== "Superadmin") {
    //   query.andWhere("f.organisation_id", orgId);
    // }
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
    const status = addedBy == 1 ? "approved" : "requested";

    const resultData = {
      investigation_id: test_name,
      name: title,
      normal_range: normal_range,
      units: units,
      field_type: field_type,
      created_at: new Date(),
      updated_at: new Date(),
      addedBy: addedBy,
      status: status,
    };

    // 1. Insert the parameter and capture the ID
    const [insertedId] = await knex("testparameters").insert(resultData);

    // --- ACTIVITY LOG START ---
    try {
      await knex("activity_logs").insert({
        user_id: addedBy,
        action_type: "CREATE",
        entity_name: "Investigation Parameter",
        entity_id: insertedId,
        details: JSON.stringify({
          data: {
            parameter_name: title,
            normal_range: normal_range,
            units: units,
            field_type: field_type,
            investigation_id: test_name,
            status: status,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for saveParamters:", logError);
    }
    // --- ACTIVITY LOG END ---

    res.status(201).json({
      message: "Results submitted successfully",
      id: insertedId,
    });
  } catch (error) {
    console.error("Error submitting results:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllTypeRequestInvestigation = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await knex("users").where("uemail", userEmail).first();

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
    const { sessionId, addedBy } = req.body;

    if (!noteId) {
      return res.status(400).json({ error: "Note ID is required." });
    }

    // Capture the note data BEFORE deletion for the activity log
    const noteToDelete = await knex("patient_notes")
      .where({ id: noteId })
      .first();

    if (!noteToDelete) {
      return res.status(404).json({ message: "Note not found." });
    }

    // Perform hard deletion
    const deletedCount = await knex("patient_notes").where("id", noteId).del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: addedBy || 1,
          action_type: "DELETE",
          entity_name: "Patient Note",
          entity_id: noteId,
          details: JSON.stringify({
            data: {
              title: noteToDelete.title,
              content: noteToDelete.content,
              patient_id: noteToDelete.patient_id,
              organisation_id: noteToDelete.organisation_id,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deletePatientNote:", logError);
      }
      // --- ACTIVITY LOG END ---
    }

    const socketData = {
      device_type: "App",
      notes: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (noteToDelete.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: noteToDelete.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Note Deleted",
              body: `A note has been deleted for patient ${noteToDelete.patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(noteToDelete.patient_id),
              noteId: String(noteId),
              type: "note_deleted", // Changed from note_added to note_deleted
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res.status(200).json({ message: "Note deleted successfully." });
  } catch (error) {
    console.error("Error deleting patient note:", error);
    return res.status(500).json({ message: "Failed to delete patient note." });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const io = getIO();
    const prescriptionId = req.params.id;
    const { sessionId, performerId } = req.body;

    if (!prescriptionId) {
      return res.status(400).json({ error: "Prescription ID is required." });
    }

    const prescriptionToDelete = await knex("prescriptions")
      .where({ id: prescriptionId })
      .first();

    if (!prescriptionToDelete) {
      return res.status(404).json({ message: "Prescription not found." });
    }

    const deletedCount = await knex("prescriptions")
      .where("id", prescriptionId)
      .del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: performerId || prescriptionToDelete.doctor_id || 1,
          action_type: "DELETE",
          entity_name: "Prescription",
          entity_id: prescriptionId,
          details: JSON.stringify({
            data: {
              medication_name: prescriptionToDelete.medication_name,
              dose: prescriptionToDelete.dose,
              route: prescriptionToDelete.route,
              frequency:
                prescriptionToDelete.Frequency ||
                prescriptionToDelete.frequency,
              patient_id: prescriptionToDelete.patient_id,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deletePrescription:", logError);
      }
    }

    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (prescriptionToDelete.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: prescriptionToDelete.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Prescription Deleted",
              body: `A Prescription has been deleted for patient ${prescriptionToDelete.patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(prescriptionToDelete.patient_id),
              prescriptionId: String(prescriptionId),
              type: "prescription_deleted",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Prescription deleted successfully." });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return res.status(500).json({ message: "Failed to delete prescription." });
  }
};

exports.deleteObservation = async (req, res) => {
  try {
    const io = getIO();
    const obsId = req.params.id;
    const { sessionId, performerId } = req.body;

    if (!obsId) {
      return res.status(400).json({ error: "observation ID is required." });
    }

    const observationToDelete = await knex("observations")
      .where({ id: obsId })
      .first();

    if (!observationToDelete) {
      return res.status(404).json({ message: "observation not found." });
    }

    const deletedCount = await knex("observations").where("id", obsId).del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: performerId || 1,
          action_type: "DELETE",
          entity_name: "Observation",
          entity_id: obsId,
          details: JSON.stringify({
            data: {
              patient_id: observationToDelete.patient_id,
              respiratory_rate: observationToDelete.respiratory_rate,
              blood_pressure: observationToDelete.blood_pressure,
              pulse: observationToDelete.pulse,
              temperature: observationToDelete.temperature,
              news2_score: observationToDelete.news2_score,
              time_stamp: observationToDelete.time_stamp,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deleteObservation:", logError);
      }
    }

    const socketData = {
      device_type: "App",
      observations: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (observationToDelete.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: observationToDelete.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Observation Deleted",
              body: `A Observation has been deleted for patient ${observationToDelete.patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(observationToDelete.patient_id),
              obsId: String(obsId),
              type: "observation_deleted",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Observation deleted successfully." });
  } catch (error) {
    console.error("Error deleting patient observation:", error);
    return res.status(500).json({ message: "Failed to delete observation." });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const io = getIO();
    const prescriptionId = req.params.id;
    const { sessionId, performerId } = req.body;

    if (!prescriptionId) {
      return res.status(400).json({ error: "Prescription ID is required." });
    }

    const prescriptionToDelete = await knex("prescriptions")
      .where({ id: prescriptionId })
      .first();

    if (!prescriptionToDelete) {
      return res.status(404).json({ message: "Prescription not found." });
    }

    const deletedCount = await knex("prescriptions")
      .where("id", prescriptionId)
      .del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: performerId || prescriptionToDelete.doctor_id || 1,
          action_type: "DELETE",
          entity_name: "Prescription",
          entity_id: prescriptionId,
          details: JSON.stringify({
            data: {
              medication_name: prescriptionToDelete.medication_name,
              dose: prescriptionToDelete.dose,
              route: prescriptionToDelete.route,
              frequency:
                prescriptionToDelete.Frequency ||
                prescriptionToDelete.frequency,
              patient_id: prescriptionToDelete.patient_id,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deletePrescription:", logError);
      }
    }

    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (prescriptionToDelete.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: prescriptionToDelete.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Prescription Deleted",
              body: `A Prescription has been deleted for patient ${prescriptionToDelete.patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(prescriptionToDelete.patient_id),
              prescriptionId: String(prescriptionId),
              type: "prescription_deleted",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Prescription deleted successfully." });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return res.status(500).json({ message: "Failed to delete prescription." });
  }
};

exports.deleteObservation = async (req, res) => {
  try {
    const io = getIO();
    const obsId = req.params.id;
    const { sessionId, performerId } = req.body; // Ensure performerId is passed from frontend

    if (!obsId) {
      return res.status(400).json({ error: "observation ID is required." });
    }

    // Fetch details BEFORE deletion for the activity log
    const observationToDelete = await knex("observations")
      .where({ id: obsId })
      .first();

    if (!observationToDelete) {
      return res.status(404).json({ message: "observation not found." });
    }

    // Perform hard deletion
    const deletedCount = await knex("observations").where("id", obsId).del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: performerId || observationToDelete.observations_by || 1,
          action_type: "DELETE",
          entity_name: "Observation",
          entity_id: obsId,
          details: JSON.stringify({
            data: {
              patient_id: observationToDelete.patient_id,
              respiratory_rate: observationToDelete.respiratory_rate,
              blood_pressure: observationToDelete.blood_pressure,
              pulse: observationToDelete.pulse,
              temperature: observationToDelete.temperature,
              news2_score: observationToDelete.news2_score,
              time_stamp: observationToDelete.time_stamp,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deleteObservation:", logError);
      }
      // --- ACTIVITY LOG END ---
    }

    const socketData = {
      device_type: "App",
      observations: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (observationToDelete.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: observationToDelete.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Observation Deleted",
              body: `A Observation has been deleted for patient ${observationToDelete.patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(observationToDelete.patient_id),
              obsId: String(obsId),
              type: "observation_deleted",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Observation deleted successfully." });
  } catch (error) {
    console.error("Error deleting patient observation:", error);
    return res.status(500).json({ message: "Failed to delete observation." });
  }
};

exports.updateCategory = async (req, res) => {
  const { oldCategory, newCategory, performerId } = req.body;

  try {
    if (!oldCategory || !newCategory) {
      return res.status(400).json({
        success: false,
        message: "Both old and new category names are required",
      });
    }

    // 1. Fetch the category before updating to get the ID and verify existence
    const existingCategory = await knex("category")
      .where("name", oldCategory)
      .first();

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 2. Perform the update
    const updatedCount = await knex("category")
      .where("id", existingCategory.id)
      .update({ name: newCategory, updated_at: knex.fn.now() });

    if (updatedCount > 0) {
      // --- ACTIVITY LOG START ---
      try {
        await knex("activity_logs").insert({
          user_id: performerId || 1,
          action_type: "UPDATE",
          entity_name: "Investigation Category",
          entity_id: existingCategory.id,
          details: JSON.stringify({
            changes: {
              name: {
                old: oldCategory,
                new: newCategory,
              },
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for updateCategory:", logError);
      }
      // --- ACTIVITY LOG END ---
    }

    return res.status(200).json({
      success: true,
      message: `Category updated successfully`,
      data: {
        oldCategory,
        newCategory,
        updatedCount: updatedCount,
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
  const { performerId } = req.body; // performerId should be passed from frontend

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Parameter ID is required.",
      });
    }

    // 1. Fetch details before deletion to capture data for the activity log
    const paramToDelete = await knex("testparameters")
      .where({ id: id })
      .first();

    if (!paramToDelete) {
      return res.status(404).json({
        success: false,
        message: "Parameter not found.",
      });
    }

    // 2. Perform the hard deletion
    const deletedCount = await knex("testparameters").where({ id: id }).del();

    if (deletedCount > 0) {
      // --- ACTIVITY LOG START ---
      try {
        await knex("activity_logs").insert({
          user_id: performerId || 1,
          action_type: "DELETE",
          entity_name: "Investigation Parameter",
          entity_id: id,
          details: JSON.stringify({
            data: {
              parameter_name: paramToDelete.name,
              normal_range: paramToDelete.normal_range,
              units: paramToDelete.units,
              investigation_id: paramToDelete.investigation_id,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deletetestparams:", logError);
      }
      // --- ACTIVITY LOG END ---

      res.status(200).json({
        success: true,
        message: "Params deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Failed to delete params: Record not found.",
      });
    }
  } catch (error) {
    console.error("Error deleting investigation params:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete params",
      error: error.message,
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
      TypeofDrug,
      DrugSubGroup,
      DrugGroup,
      Duration,
      Instructions,
      Frequency,
      Way,
      Unit,
      dose,
      route,
      start_date,
      days_given,
      administration_time,
    } = req.body;

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

    const [id] = await knex("prescriptions").insert({
      patient_id,
      doctor_id,
      organisation_id,
      description,
      medication_name,
      indication,
      dose,
      DrugGroup,
      DrugSubGroup,
      TypeofDrug,
      Duration,
      Instructions,
      Frequency,
      Way,
      Unit,
      route,
      start_date,
      days_given,
      administration_time,
      created_at: new Date(),
      updated_at: new Date(),
    });

    try {
      await knex("activity_logs").insert({
        user_id: doctor_id || 1,
        action_type: "CREATE",
        entity_name: "Prescription",
        entity_id: id,
        details: JSON.stringify({
          data: {
            patient_id: patient_id,
            medication_name: medication_name,
            dose: dose,
            route: route,
            frequency: Frequency,
            duration: Duration,
            instructions: Instructions,
            start_date: start_date,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for addPrescription:", logError);
    }

    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "New Prescription Added",
              body: `A new Prescription has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "prescriptions",
            },
          };

          try {
            await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

    return res.status(201).json({
      id,
      message: "Prescription added successfully",
    });
  } catch (error) {
    console.error("Error adding prescription:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

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
        "p.Unit",
        "p.Way",
        "p.Frequency",
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

exports.getPrescriptionsById = async (req, res) => {
  const prescriptionId = req.params.prescriptionId;

  // Validate ID
  if (!prescriptionId || isNaN(Number(prescriptionId))) {
    return res.status(400).json({
      success: false,
      message: "Invalid prescription ID",
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
        "p.Unit",
        "p.Way",
        "p.Frequency",
        "p.created_at",
        "p.updated_at",
        "p.TypeofDrug",
        "p.DrugSubGroup",
        "p.DrugGroup",
        "p.medication_name",
        "p.Duration",
        "p.Instructions"
      )
      .where("p.id", prescriptionId)
      .first();

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
        await trx("categorytest").where("id", investigation_id).update({
          name: test_name,
          updated_at: trx.fn.now(),
        });
      }

      if (category && original_category) {
        await trx("category").where("name", original_category).update({
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

      if (paramsArray && Array.isArray(paramsArray)) {
        for (const param of paramsArray) {
          await trx("testparameters").where("id", param.id).update({
            name: param.name,
            normal_range: param.normal_range,
            units: param.units,
            updated_at: knex.fn.now(),
            field_type: param.field_type,
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
    TypeofDrug,
    DrugSubGroup,
    DrugGroup,
    Duration,
    Instructions,
    Frequency,
    Way,
    Unit,
    route,
    start_date,
    days_given,
    administration_time,
    patient_id,
    doctor_id,
    sessionId,
    performerId,
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
        DrugGroup,
        DrugSubGroup,
        TypeofDrug,
        Duration,
        Instructions,
        Frequency,
        Way,
        Unit,
        start_date,
        days_given,
        administration_time,
        patient_id,
        // doctor_id,
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

    const socketData = {
      device_type: "App",
      prescriptions: "update",
    };

    if (sessionId) {
      const roomName = `session_${sessionId}`;
      io.to(roomName).emit(
        "refreshPatientData",
        JSON.stringify(socketData, null, 2)
      );
    }

    if (updatedPrescription.organisation_id && sessionId != 0) {
      const users = await knex("users").where({
        organisation_id: updatedPrescription.organisation_id,
        role: "User",
      });

      for (const user of users) {
        if (user && user.fcm_token) {
          const token = user.fcm_token;

          const message = {
            notification: {
              title: "Prescription Updated",
              body: `A new Prescription has been added for patient ${patient_id}.`,
            },
            token: token,
            data: {
              sessionId: String(sessionId),
              patientId: String(patient_id),
              type: "prescriptions",
            },
          };

          try {
            const response = await secondaryApp.messaging().send(message);
          } catch (notifErr) {
            console.error(
              `❌ Error sending FCM notification to user ${user.id}:`,
              notifErr
            );
          }
        }
      }
    }

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
      .where("status", "completed")
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

exports.getReportTemplates = async (req, res) => {
  try {
    const { investigationId, patientId } = req.query;

    if (!investigationId || !patientId) {
      return res
        .status(400)
        .json({ error: "investigationId and patientId are required" });
    }

    // 1. Fetch Parameter Metadata (needed to fill names/units for the JSON values)
    const paramMetadata = await knex("testparameters")
      .where("investigation_id", investigationId)
      .select("id", "name", "normal_range", "units", "field_type");

    // Create a lookup dictionary for parameters
    const paramMap = {};
    paramMetadata.forEach((p) => {
      paramMap[p.id] = p;
    });

    // 2. Fetch Patient-Specific Reports (Existing Logic)
    const reportRows = await knex("investigation_reports as ir")
      .join("testparameters as tp", "ir.parameter_id", "tp.id")
      .select(
        "ir.id as report_id",
        "ir.request_investigation_id",
        "ir.investigation_id",
        "ir.patient_id",
        "ir.submitted_by",
        "ir.value",
        "ir.created_at",
        "tp.id as parameter_id",
        "tp.name as parameter_name",
        "tp.normal_range",
        "tp.units",
        "tp.field_type"
      )
      .where("ir.investigation_id", investigationId)
      .andWhere("ir.patient_id", patientId)
      .orderBy("ir.created_at", "desc");

    // 3. Fetch Library Templates from report_templates table
    const libraryRows = await knex("report_templates")
      .where("investigation_id", investigationId)
      .select("*");

    const templatesMap = {};

    // --- Process Patient Reports ---
    reportRows.forEach((row) => {
      const groupId = `report_${row.request_investigation_id}`;
      if (!templatesMap[groupId]) {
        templatesMap[groupId] = {
          id: row.request_investigation_id,
          name: `Report ${row.request_investigation_id}`,
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
        value: row.value ?? "",
        normal_range: row.normal_range,
        units: row.units,
        field_type: row.field_type,
      });
    });

    // --- Process Library Templates (Parsing the JSON) ---
    libraryRows.forEach((row) => {
      const groupId = `lib_${row.id}`;

      // Handle the JSON parameter values
      let valuesArray = [];
      try {
        valuesArray =
          typeof row.parameter_values === "string"
            ? JSON.parse(row.parameter_values)
            : row.parameter_values;
      } catch (e) {
        valuesArray = [];
      }

      if (!templatesMap[groupId]) {
        templatesMap[groupId] = {
          id: row.id,
          name: row.template_name, // e.g., "Arterial blood gas Normal"
          investigation_id: row.investigation_id,
          patient_id: patientId, // Contextual to current patient
          submitted_by: row.addedBy,
          created_at: row.created_at,
          parameters: [],
        };
      }

      // Map the values from JSON back to the full parameter metadata structure
      valuesArray.forEach((valObj) => {
        const meta = paramMap[valObj.parameter_id];
        if (meta) {
          templatesMap[groupId].parameters.push({
            parameter_id: valObj.parameter_id,
            name: meta.name,
            value: valObj.value ?? "",
            normal_range: meta.normal_range,
            units: meta.units,
            field_type: meta.field_type,
          });
        }
      });
    });

    // Convert map to array and sort by most recent
    const templates = Object.values(templatesMap).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(templates);
  } catch (err) {
    console.error("Error fetching report templates:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.addNewMedication = async (req, res) => {
  const { medication, dose, DrugSubGroup, TypeofDrug, DrugGroup, userEmail } =
    req.body;

  if (!medication || !dose) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const userData = await knex("users").where({ uemail: userEmail }).first();

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const [newMedId] = await knex("medications_list").insert({
      medication,
      dose,
      DrugSubGroup,
      TypeofDrug,
      DrugGroup,
      added_by: userData.id,
      org_id: userData.organisation_id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });

    try {
      await knex("activity_logs").insert({
        user_id: userData.id,
        action_type: "CREATE",
        entity_name: "Medication",
        entity_id: newMedId,
        details: JSON.stringify({
          data: {
            medication_name: medication,
            dose: dose,
            drug_group: DrugGroup,
            drug_sub_group: DrugSubGroup,
            type_of_drug: TypeofDrug,
            organisation_id: userData.organisation_id,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for addNewMedication:", logError);
    }
    // --- ACTIVITY LOG END ---

    res.status(201).json({
      medication,
      dose,
    });
  } catch (error) {
    console.error("Error adding medication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateMedication = async (req, res) => {
  const { medication, dose, id, performerId } = req.body;

  if (!medication || !dose) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Fetch old data for comparison before updating
    const oldMedication = await knex("medications_list").where({ id }).first();

    if (!oldMedication) {
      return res.status(404).json({ message: "Medication not found" });
    }

    // Calculate changes for Activity Log
    const changes = {};
    if (oldMedication.medication !== medication) {
      changes.medication = {
        old: oldMedication.medication || "N/A",
        new: medication,
      };
    }
    if (oldMedication.dose !== dose) {
      changes.dose = {
        old: oldMedication.dose || "N/A",
        new: dose,
      };
    }

    // Execute update
    const updatedCount = await knex("medications_list").where({ id }).update({
      medication,
      dose,
      updated_at: knex.fn.now(),
    });

    if (updatedCount > 0) {
      try {
        if (Object.keys(changes).length > 0) {
          await knex("activity_logs").insert({
            user_id: performerId || oldMedication.added_by || 1,
            action_type: "UPDATE",
            entity_name: "Medication",
            entity_id: id,
            details: JSON.stringify({ changes }),
            created_at: new Date(),
          });
        }
      } catch (logError) {
        console.error("Activity log failed for updateMedication:", logError);
      }
      // --- ACTIVITY LOG END ---
    }

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
  const { performerId } = req.body;

  try {
    // 1. Fetch details before deletion to capture data for the activity log
    const medicationToDelete = await knex("medications_list")
      .where({ id })
      .first();

    if (!medicationToDelete) {
      return res.status(404).json({
        message: "Medication not found",
      });
    }

    // 2. Perform the hard deletion
    const deletedCount = await knex("medications_list").where({ id }).delete();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: performerId || medicationToDelete.added_by || 1,
          action_type: "DELETE",
          entity_name: "Medication",
          entity_id: id,
          details: JSON.stringify({
            data: {
              medication_name: medicationToDelete.medication,
              dose: medicationToDelete.dose,
              drug_group: medicationToDelete.DrugGroup,
              drug_sub_group: medicationToDelete.DrugSubGroup,
              status: "Permanently Deleted",
              org_id: medicationToDelete.org_id,
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deleteMedication:", logError);
      }
      // --- ACTIVITY LOG END ---
    }

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
      "DrugGroup",
      "DrugSubGroup",
      "TypeofDrug",
      "medication",
      "dose"
    );

    res.status(200).json(medications);
  } catch (error) {
    console.error("Error fetching medications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getActivePatients = async (req, res) => {
  try {
    const wardSessions = await knex("wardsession").where("status", "ACTIVE");

    if (!Array.isArray(wardSessions) || wardSessions.length === 0) {
      return res.status(200).json([]);
    }

    const activePatientIds = wardSessions.flatMap((session) => {
      const assignments =
        typeof session.assignments === "string"
          ? JSON.parse(session.assignments)
          : session.assignments;

      return Object.values(assignments || {}).flatMap((v) =>
        Array.isArray(v?.patientIds) ? v.patientIds : []
      );
    });

    res.status(200).json(activePatientIds);
  } catch (error) {
    console.error("Error fetching medications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getImageTestsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    const rows = await knex("categorytest as ct")
      .join("testparameters as tp", "tp.investigation_id", "ct.id")
      .join("category as c", "c.id", "ct.category")
      .select(
        "ct.id",
        "ct.name as test_name",
        "ct.category as category_id",
        "c.name as category_name",
        knex.raw("MIN(tp.id) as test_parameter_id")
      )
      .where("c.name", category)
      .andWhere("tp.field_type", "image")
      .groupBy("ct.id", "ct.name", "ct.category", "c.name")
      .orderBy("ct.name", "asc");

    res.json(rows);
  } catch (err) {
    console.error("Error fetching image tests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getImageSize = async (url) => {
  try {
    const response = await axios.head(url);
    const contentLength = response.headers["content-length"];
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch (error) {
    console.error(`Error getting image size for ${url}:`, error);
    // Return 0 if the image size cannot be fetched
    return 0;
  }
};

exports.uploadImagesToLibrary = async (req, res) => {
  try {
    const {
      test_name,
      investigation_id,
      images,
      removed_images = [],
      added_by,
      visibility,
      organization_id,
    } = req.body;

    if (removed_images && removed_images.length > 0) {
      await knex("image_library")
        .whereIn("image_url", removed_images)
        .andWhere({ investigation_id })
        .del();
    }

    if (visibility === "private" && images && images.length > 0) {
      const setting = await knex("settings").first();

      const storage_limit_gb = setting ? setting.storage : 1;
      const storage_limit_bytes = storage_limit_gb * 1024 * 1024 * 1024;
      // const storage_limit_bytes = 5000000;

      const result = await knex("image_library")
        .where({ orgId: organization_id, type: "private" })
        .sum("size as total_size")
        .first();

      const current_usage_bytes = Number(result.total_size) || 0;

      let new_images_size_bytes = 0;
      for (const url of images) {
        const size = await getImageSize(url);
        new_images_size_bytes += size;
      }

      if (current_usage_bytes + new_images_size_bytes > storage_limit_bytes) {
        return res.status(400).json({
          error: "Insufficient storage space",
          limit_bytes: storage_limit_bytes,
          current_usage_bytes: current_usage_bytes,
          new_images_size_bytes: new_images_size_bytes,
        });
      }
    }

    let uploadedImages = [];
    if (images && images.length > 0) {
      for (const url of images) {
        const image_size_in_bytes = await getImageSize(url);

        uploadedImages.push({
          investigation_id,
          test_parameters: test_name,
          added_by,
          image_url: url,
          type: visibility,
          orgId: organization_id,
          status: "active",
          size: image_size_in_bytes,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      await knex("image_library").insert(uploadedImages);
    }

    res.json({
      message: "Images uploaded successfully",
      data: uploadedImages,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getImagesByInvestigation = async (req, res) => {
  try {
    const { investigation_id } = req.params;
    if (!investigation_id) {
      return res.status(400).json({ error: "investigation_id is required" });
    }

    const rawImages = await knex("image_library")
      .select(
        "id",
        "image_url",
        "test_parameters",
        "added_by",
        "status",
        "created_at"
      )
      .where({ investigation_id: Number(investigation_id) });

    const detailedDataPromises = rawImages.map(async (imageData) => {
      let size = 0;
      try {
        const response = await axios.head(imageData.image_url);
        if (response.headers["content-length"]) {
          size = parseInt(response.headers["content-length"], 10);
        }
      } catch (error) {
        console.error(
          `Failed to get size for ${imageData.image_url}:`,
          error.message
        );
      }

      const fullFileName = imageData.image_url.substring(
        imageData.image_url.lastIndexOf("/") + 1
      );
      const name = fullFileName.substring(fullFileName.lastIndexOf("-") + 1);

      return {
        ...imageData,
        name,
        size,
      };
    });

    const allImages = await Promise.all(detailedDataPromises);

    // ✅ Filter to only unique images by name (can also include size if needed)
    const seenNames = new Set();
    const uniqueImages = allImages.filter((img) => {
      if (seenNames.has(img.name)) return false;
      seenNames.add(img.name);
      return true;
    });

    res.json({ images: uniqueImages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getExportData = async (req, res) => {
  const id = req.params.id;
  try {
    const data = await knex("fluid_balance")
      .select(
        "id as ScenarioId",
        "observations_by as RunId",
        "patient_id as PatientId",
        "type as Type",
        "fluid_intake as VolumeML",
        "duration as Rate",
        "route as Route",
        "notes as Notes",
        knex.raw(
          "DATE_FORMAT(fluid_balance.timestamp, '%Y-%m-%d %H:%i:%s') as TimeStamp"
        )
      )
      .where({ patient_id: id });

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("fluid_balance.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ success: false, message: "Failed to export CSV" });
  }
};

exports.getPatientsByOrgId = async (req, res) => {
  const { orgId } = req.params;

  try {
    const activePatients = await knex("virtual_section")
      .where("status", "active")
      .pluck("selected_patient");

    const patients = await knex("patient_records")
      .where("organisation_id", orgId)
      .andWhere("status", "completed")
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      })
      .whereNotIn("id", activePatients)
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

exports.requestedParameters = async (req, res) => {
  try {
    const requestedParams = await knex("testparameters")
      .where({ status: "requested" })
      .select("*");

    const paramInvestigationIds = requestedParams.map(
      (p) => p.investigation_id
    );

    const relevantTests = await knex("categorytest")
      .where({ status: "requested" })
      .orWhereIn("id", paramInvestigationIds)
      .select("*");

    const testCategoryIds = relevantTests.map((t) => t.category);

    const relevantCategories = await knex("category")
      .whereIn("id", testCategoryIds)
      .select("*");

    const parametersByTestId = new Map();
    requestedParams.forEach((param) => {
      const formattedParam = {
        ...param,
        state: param.status,
      };

      if (!parametersByTestId.has(param.investigation_id)) {
        parametersByTestId.set(param.investigation_id, []);
      }
      parametersByTestId.get(param.investigation_id).push(formattedParam);
    });

    const testsByCategoryId = new Map();
    relevantTests.forEach((test) => {
      const hasRequestedParams = parametersByTestId.has(test.id);

      if (test.status === "requested" || hasRequestedParams) {
        const parentCat = relevantCategories.find(
          (c) => c.id === test.category
        );

        const formattedTest = {
          id: test.id,
          category: parentCat ? parentCat.name : "",
          test_name: test.name,
          status: "active",
          created_at: test.created_at,
          updated_at: test.updated_at,
          addedBy: "1",
          state: test.status,
          testAddedBy: test.addedBy,
          parameters: parametersByTestId.get(test.id) || [],
        };

        if (!testsByCategoryId.has(test.category)) {
          testsByCategoryId.set(test.category, []);
        }
        testsByCategoryId.get(test.category).push(formattedTest);
      }
    });

    const result = relevantCategories
      .map((cat) => {
        const investigations = testsByCategoryId.get(cat.id) || [];
        if (investigations.length === 0 && cat.status !== "requested") {
          return null;
        }

        return {
          id: cat.id,
          category: cat.name,
          state: cat.status,
          investigations: investigations,
        };
      })
      .filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log("Error fetching requested parameters:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch data",
    });
  }
};

exports.manageRequest = async (req, res) => {
  const { type, id, action } = req.body;

  const validTypes = ["category", "investigation", "parameter"];
  const validActions = ["approve", "reject"];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid type" });
  }
  if (!validActions.includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  try {
    await knex.transaction(async (trx) => {
      if (action === "reject") {
        if (type === "category") {
          const investigationIds = await trx("categorytest")
            .where({ category: id })
            .pluck("id");

          if (investigationIds.length > 0) {
            await trx("testparameters")
              .whereIn("investigation_id", investigationIds)
              .del();
          }

          await trx("categorytest").where({ category: id }).del();
          await trx("category").where({ id }).del();
        } else if (type === "investigation") {
          await trx("testparameters").where({ investigation_id: id }).del();
          await trx("categorytest").where({ id }).del();
        } else if (type === "parameter") {
          await trx("testparameters").where({ id }).del();
        }
      } else if (action === "approve") {
        if (type === "category") {
          await trx("category")
            .where({ id })
            .update({ status: "approved", updated_at: knex.fn.now() });
        } else if (type === "investigation") {
          await trx("categorytest")
            .where({ id })
            .update({ status: "approved", updated_at: knex.fn.now() });

          const testInfo = await trx("categorytest")
            .where({ id })
            .select("category")
            .first();

          if (testInfo && testInfo.category) {
            await trx("category")
              .where({ id: testInfo.category })
              .update({ status: "approved", updated_at: knex.fn.now() });
          }
        } else if (type === "parameter") {
          await trx("testparameters")
            .where({ id })
            .update({ status: "approved", updated_at: knex.fn.now() });

          const testInfo = await trx("testparameters")
            .where({ id })
            .select("investigation_id")
            .first();

          if (testInfo && testInfo.investigation_id) {
            await trx("categorytest")
              .where({ id: testInfo.investigation_id })
              .update({ status: "approved", updated_at: knex.fn.now() });

            const categoryInfo = await trx("categorytest")
              .where({ id: testInfo.investigation_id })
              .select("category")
              .first();

            if (categoryInfo && categoryInfo.category) {
              await trx("category")
                .where({ id: categoryInfo.category })
                .update({ status: "approved", updated_at: knex.fn.now() });
            }
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: `${type} has been ${action}ed successfully.`,
    });
  } catch (error) {
    console.error("Error managing request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error processing request.",
    });
  }
};

exports.getAllInvestigations = async (req, res) => {
  try {
    const rows = await knex("category")
      .join("categorytest", "category.id", "categorytest.category")
      .select(
        "category.id as category_id",
        "category.name as category_name",
        "category.status as category_status",
        "category.addedBy as category_addedBy",
        "categorytest.id as test_id",
        "categorytest.name as test_name",
        "categorytest.status as test_status",
        "categorytest.addedBy as test_addedBy"
      )
      .where((builder) => {
        builder
          .where("category.status", "!=", "requested")
          .orWhereNull("category.status");
      })
      .andWhere((builder) => {
        builder
          .where("categorytest.status", "!=", "requested")
          .orWhereNull("categorytest.status");
      })
      .whereExists(function () {
        this.select(1)
          .from("testparameters")
          .whereRaw("testparameters.investigation_id = categorytest.id")
          .andWhere((builder) => {
            builder
              .where("testparameters.status", "!=", "requested")
              .orWhereNull("testparameters.status");
          });
      });

    const groups = {};

    rows.forEach((row) => {
      if (!groups[row.category_id]) {
        groups[row.category_id] = {
          id: row.category_id,
          name: row.category_name,
          status: row.category_status,
          addedBy: row.category_addedBy,
          investigations: [],
        };
      }

      groups[row.category_id].investigations.push({
        id: row.test_id,
        name: row.test_name,
        status: row.test_status,
        addedBy: row.test_addedBy,
      });
    });

    const finalResult = Object.values(groups);

    return res.status(200).json({
      success: true,
      count: finalResult.length,
      data: finalResult,
    });
  } catch (error) {
    console.error("Error getting investigations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteInvestigation = async (req, res) => {
  const { type, id, performerId } = req.body;

  if (!id || !type) {
    return res.status(400).json({
      success: false,
      message: "ID and Type are required",
    });
  }

  try {
    let entityName = "";
    let recordData = null;
    const userId = performerId || 1;

    // 1. Fetch data before deletion for activity logging
    if (type === "parameter") {
      recordData = await knex("testparameters").where("id", id).first();
      entityName = "Investigation Parameter";
    } else if (type === "investigation") {
      recordData = await knex("categorytest").where("id", id).first();
      entityName = "Investigation";
    } else if (type === "category") {
      recordData = await knex("category").where("id", id).first();
      entityName = "Investigation Category";
    }

    if (!recordData) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    // 2. Perform Deletions
    if (type === "parameter") {
      await knex("testparameters").where("id", id).del();
    } else if (type === "investigation") {
      await knex("testparameters").where("investigation_id", id).del();
      await knex("categorytest").where("id", id).del();
    } else if (type === "category") {
      await knex("testparameters")
        .whereIn("investigation_id", function () {
          this.select("id").from("categorytest").where("category", id);
        })
        .del();
      await knex("categorytest").where("category", id).del();
      await knex("category").where("id", id).del();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid entity type provided",
      });
    }

    // --- ACTIVITY LOG START ---
    try {
      await knex("activity_logs").insert({
        user_id: userId,
        action_type: "DELETE",
        entity_name: entityName,
        entity_id: id,
        details: JSON.stringify({
          data: {
            name: recordData.name || recordData.parameter_name || "N/A",
            type: type,
            status: "Permanently Deleted",
            deleted_record_details: recordData,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for deleteInvestigation:", logError);
    }
    // --- ACTIVITY LOG END ---

    res.status(200).json({
      success: true,
      message: `${type} and related data deleted successfully`,
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};

exports.updateInvestigationResult = async (req, res) => {
  const { report_id, updates, submitted_by } = req.body;

  if (!report_id || !updates || !Array.isArray(updates) || !submitted_by) {
    return res.status(400).json({
      error:
        "Invalid request. 'report_id', 'submitted_by', and 'updates' array are required.",
    });
  }

  try {
    const user = await knex("users")
      .select("organisation_id")
      .where("id", submitted_by)
      .first();

    if (!user) {
      return res.status(400).json({
        error: `User with ID ${submitted_by} not found.`,
      });
    }

    const userOrgId = user.organisation_id;

    // 1. Fetch old values before update for the Activity Log
    const oldReports = await knex("investigation_reports")
      .where({ request_investigation_id: report_id })
      .select("parameter_id", "value");

    const changes = {};

    for (const item of updates) {
      // Find the corresponding old record to check for changes
      const oldRecord = oldReports.find(
        (r) => r.parameter_id === item.parameter_id
      );

      if (oldRecord && String(oldRecord.value) !== String(item.value)) {
        // Track the change (using parameter ID as key)
        changes[`parameter_${item.parameter_id}`] = {
          old: oldRecord.value || "N/A",
          new: item.value,
        };
      }

      // 2. Perform the update
      await knex("investigation_reports")
        .where({
          request_investigation_id: report_id,
          parameter_id: item.parameter_id,
        })
        .update({
          value: item.value,
          submitted_by: submitted_by,
          organisation_id: userOrgId,
          updated_at: knex.fn.now(),
        });
    }

    // 3. Update the request investigation parent record
    await knex("request_investigation").where("id", report_id).update({
      updated_at: knex.fn.now(),
      organisation_id: userOrgId,
    });

    // --- ACTIVITY LOG START ---
    try {
      if (Object.keys(changes).length > 0) {
        await knex("activity_logs").insert({
          user_id: submitted_by,
          action_type: "UPDATE",
          entity_name: "Investigation Report",
          entity_id: report_id,
          details: JSON.stringify({ changes }),
          created_at: new Date(),
        });
      }
    } catch (logError) {
      console.error(
        "Activity log failed for updateInvestigationResult:",
        logError
      );
    }
    // --- ACTIVITY LOG END ---

    return res.status(200).json({
      success: true,
      message: "Investigation report updated successfully",
    });
  } catch (err) {
    console.error("Update Investigation Error:", err);
    return res.status(500).json({
      error: "Failed to update investigation report",
      details: err.message,
    });
  }
};

exports.deleteInvestigationReport = async (req, res) => {
  const { report_id, informerId } = req.body;

  if (!report_id) {
    return res.status(400).json({ error: "Report ID is required" });
  }

  try {
    // 1. Fetch metadata before deletion to capture data for the activity log
    const reportToDelete = await knex("request_investigation")
      .where("id", report_id)
      .first();

    if (!reportToDelete) {
      return res.status(404).json({ error: "Report not found" });
    }

    // 2. Perform deletions within a transaction
    await knex.transaction(async (trx) => {
      await knex("investigation_reports")
        .transacting(trx)
        .where("request_investigation_id", report_id)
        .del();

      await knex("request_investigation")
        .transacting(trx)
        .where("id", report_id)
        .del();

      await knex("reportnotes")
        .transacting(trx)
        .where("reportId", report_id)
        .del();
    });

    // --- ACTIVITY LOG START ---
    try {
      await knex("activity_logs").insert({
        user_id: informerId || 1,
        action_type: "DELETE",
        entity_name: "Investigation Report",
        entity_id: report_id,
        details: JSON.stringify({
          data: {
            test_name: reportToDelete.test_name || "Investigation",
            patient_id: reportToDelete.patient_id,
            organisation_id: reportToDelete.organisation_id,
            status: "Permanently Deleted",
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error(
        "Activity log failed for deleteInvestigationReport:",
        logError
      );
    }
    // --- ACTIVITY LOG END ---

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (err) {
    console.error("Delete Report Error:", err);
    return res.status(500).json({
      error: "Failed to delete report",
      details: err.message,
    });
  }
};

exports.addComments = async (req, res) => {
  const { reportId, note, addedBy } = req.body;

  try {
    const notesData = {
      reportId: reportId,
      note: note,
      addedBy: addedBy,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await knex("reportnotes").insert(notesData);

    return res.status(201).json({
      success: true,
      message: "Note added successfully",
      data: notesData,
    });
  } catch (error) {
    console.error("Error adding comment:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateComments = async (req, res) => {
  const { commentId, note } = req.body;

  try {
    await knex("reportnotes").where({ id: commentId }).update({ note });

    return res.status(201).json({
      success: true,
      message: "Note updated successfully",
    });
  } catch (error) {
    console.error("Error updating comment:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteComments = async (req, res) => {
  const { id } = req.params;

  try {
    await knex("reportnotes").where({ id: id }).del();

    return res.status(201).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteFluidBalance = async (req, res) => {
  const { id } = req.params;
  const { sessionId, performerId } = req.body;

  try {
    const recordToDelete = await knex("fluid_balance")
      .where({ id: id })
      .first();

    if (!recordToDelete) {
      return res.status(404).json({
        success: false,
        message: "Fluid Balance record not found",
      });
    }

    const deletedCount = await knex("fluid_balance").where({ id: id }).del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: performerId || 1,
          action_type: "DELETE",
          entity_name: "Fluid Balance",
          entity_id: id,
          details: JSON.stringify({
            data: {
              patient_id: recordToDelete.patient_id,
              fluid_intake: recordToDelete.fluid_intake,
              type: recordToDelete.type,
              units: recordToDelete.units,
              route: recordToDelete.route,
              timestamp: recordToDelete.timestamp,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deleteFluidBalance:", logError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Fluid Balance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Fluid Balance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.generateObservations = async (req, res) => {
  let { condition, age, scenarioType, count, intervals, startTime } = req.body;

  if (!condition || !scenarioType) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: condition, scenarioType",
    });
  }

  count = Math.max(1, Math.min(parseInt(count) || 1, 3));

  try {
    const systemPrompt = `
      You are an expert medical simulator. Generate realistic patient vital sign observations.
      
      CRITICAL RULE: You MUST calculate Early Warning Scores (NEWS2, PEWS, MEWS) correctly based on the vitals you generate.
      
      SCENARIO LOGIC:
      - "Normal": Vitals are healthy. Scores should be 0 or 1.
      - "Deteriorating": Vitals are drifting (e.g., RR 22, O2 94%). Scores MUST be between 2 and 4.
      - "Acute": Vitals are critical (e.g., RR 28, O2 88%, BP 90/50). Scores MUST be HIGH (5 or more).
      
      Output ONLY a JSON array containing ${count} observation object(s).

      The JSON objects must use these exact keys:
      - respiratoryRate (number)
      - o2Sats (number, 0-100)
      - oxygenDelivery (string options: "Room Air", "Nasal Cannula", "Venturi Mask", "Non-Rebreather Mask", "CPAP", "Mechanical Ventilation")
      - bloodPressure (string format "systolic/diastolic", e.g., "120/80")
      - pulse (number)
      - consciousness (string options: "Alert", "Voice", "Pain", "Unresponsive")
      - temperature (number, celsius, e.g., 36.5)
      
      - news2Score (number: MUST NOT BE 0 if scenario is "Deteriorating" or "Acute")
      - pewsScore (number: Pediatric Score. If patient is <16, calculate this carefully.)
      - mewsScore (number: Modified Early Warning Score.)
      - notes (Short clinical comment)
    `;

    const userPrompt = `
      Patient Profile:
      - Age: ${age || "Adult"}
      - Condition: ${condition}
      - Current State: ${scenarioType}

      Generate ${count} observation set(s).
      
      IMPORTANT: 
      If state is "${scenarioType}", the vital signs must reflect this. 
      For "${scenarioType}", the NEWS2/MEWS/PEWS scores CANNOT be 0. 
      Example: If "Acute", Respiratory Rate should be high (>25) and O2 sats low (<92), leading to a high score.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const rawOutput = completion.choices[0].message.content;
    let jsonData;
    try {
      const cleanJson = rawOutput
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      jsonData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("AI Observation Parse Error:", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response.",
        rawOutput,
      });
    }

    function parseInterval(intervalValue) {
      if (!intervalValue) return 15;
      const lower = intervalValue.toLowerCase().trim();

      if (lower.includes("hr")) {
        return parseInt(lower) * 60;
      }

      return parseInt(lower) || 15;
    }

    const intervalMinutes = parseInterval(intervals);
    const baseTime = new Date(startTime);

    jsonData = jsonData.map((obs, index) => {
      const obsTime = new Date(
        baseTime.getTime() + index * intervalMinutes * 60000
      );
      return {
        ...obs,
        timestamp: obsTime.toISOString(),
      };
    });

    return res.status(200).json({
      success: true,
      data: jsonData,
    });
  } catch (err) {
    console.error("OpenAI Error:", err);
    return res.status(500).json({
      success: false,
      message: "AI observation generation failed.",
    });
  }
};

exports.saveTemplate = async (req, res) => {
  try {
    const { investigation_id, template_name, parameter_values, addedBy } =
      req.body;

    const [id] = await knex("report_templates").insert({
      investigation_id,
      template_name,
      parameter_values: JSON.stringify(parameter_values),
      addedBy,
    });

    try {
      await knex("activity_logs").insert({
        user_id: addedBy || 1,
        action_type: "CREATE",
        entity_name: "Report Template",
        entity_id: id,
        details: JSON.stringify({
          data: {
            investigation_id,
            template_name,
            parameter_values,
            status: "Template Created",
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for saveTemplate:", logError);
    }

    res.status(201).json({ success: true, id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const { investigation_id } = req.params;
    const invId = investigation_id.trim();

    const parameters = await knex("testparameters")
      .where({ investigation_id: invId })
      .select("id", "name", "normal_range", "units", "field_type");

    const templatesRaw = await knex("report_templates")
      .where({ investigation_id: invId })
      .orderBy("created_at", "desc");

    const templates = templatesRaw.map((row) => {
      // Handle JSON parsing safely
      let parsedValues = row.parameter_values;

      if (typeof parsedValues === "string") {
        try {
          parsedValues = JSON.parse(parsedValues);
        } catch (e) {
          parsedValues = [];
        }
      }

      // Ensure we are working with an array before reducing
      const valuesMap = Array.isArray(parsedValues)
        ? parsedValues.reduce((acc, curr) => {
            if (curr.parameter_id) {
              acc[curr.parameter_id] = curr.value;
            }
            return acc;
          }, {})
        : {};

      return {
        id: row.id,
        template_name: row.template_name,
        values: valuesMap,
      };
    });

    res.json({
      status: "success",
      parameters: parameters,
      templates: templates,
    });
  } catch (error) {
    console.error("Error in getTemplates: ", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;
  const { deletedBy } = req.body;

  try {
    // 1. Fetch the record first so we have data for the log
    const recordToDelete = await knex("report_templates")
      .where({ id: id })
      .first();

    if (!recordToDelete) {
      return res.status(404).json({
        success: false,
        message: "Report Template not found",
      });
    }

    const deletedCount = await knex("report_templates").where({ id: id }).del();

    if (deletedCount > 0) {
      try {
        await knex("activity_logs").insert({
          user_id: deletedBy || 1,
          action_type: "DELETE",
          entity_name: "Report Template",
          entity_id: id,
          details: JSON.stringify({
            data: {
              investigation_id: recordToDelete.investigation_id,
              template_name: recordToDelete.template_name,
              parameter_values: recordToDelete.parameter_values,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deleteTemplate:", logError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Template:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
