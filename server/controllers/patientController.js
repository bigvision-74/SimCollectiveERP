const bcrypt = require("bcrypt");
const { uploadFile, deleteObject } = require("../services/S3_Services");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
// const welcomeEmail = fs.readFileSync("./EmailTemplates/PatientWelcome.ejs", "utf8");
// const compiledWelcome = ejs.compile(welcomeEmail);
require("dotenv").config();

// Helper function to generate patient ID
function generatePatientId() {
    const prefix = "PAT";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
}

// Create a new patient
exports.createPatient = async (req, res) => {
    const patientData = req.body;
    console.log(patientData, "patientData");
    try {
        // Validate required fields
        if (!patientData.name || !patientData.dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: "Name, date of birth, are required"
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
                    message: "Email already exists"
                });
            }
        }

        // Create new patient record with all fields
        const newPatient = {
            name: patientData.name,
            // last_name: patientData.lastName,
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
            lifestyle_and_home_situation: patientData.lifestyleAndHomeSituation || null,
            medical_equipment: patientData.medicalEquipment || null,
            pharmaceuticals: patientData.pharmaceuticals || null,
            diagnostic_equipment: patientData.diagnosticEquipment || null,
            blood_tests: patientData.bloodTests || null,
            initial_admission_observations: patientData.initialAdmissionObservations || null,
            expected_observations_for_acute_condition: patientData.expectedObservationsForAcuteCondition || null,
            patient_assessment: patientData.patientAssessment || null,
            recommended_observations_during_event: patientData.recommendedObservationsDuringEvent || null,
            observation_results_recovery: patientData.observationResultsRecovery || null,
            observation_results_deterioration: patientData.observationResultsDeterioration || null,
            recommended_diagnostic_tests: patientData.recommendedDiagnosticTests || null,
            treatment_algorithm: patientData.treatmentAlgorithm || null,
            correct_treatment: patientData.correctTreatment || null,
            expected_outcome: patientData.expectedOutcome || null,
            healthcare_team_roles: patientData.healthcareTeamRoles || null,
            team_traits: patientData.teamTraits || null,
            created_at: new Date(),
            updated_at: new Date()
        };

        // Insert into database
        const result = await knex("patient_records").insert(newPatient);
        const patientDbId = result[0];

        // Send welcome email if email provided
        // if (patientData.email) {
        //     const emailData = {
        //         name: `${patientData.firstName} ${patientData.lastName}`,
        //         patientId: patientData.patientId,
        //         date: new Date().getFullYear()
        //     };

        //     try {
        //         const renderedEmail = compiledWelcome(emailData);
        //         await sendMail(
        //             patientData.email,
        //             "Welcome to Our Healthcare System",
        //             renderedEmail
        //         );
        //     } catch (emailError) {
        //         console.error("Failed to send welcome email:", emailError);
        //     }
        // }

        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            id: patientDbId
        });

    } catch (error) {
        console.error("Error creating patient:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create patient"
        });
    }
};

// Get all patients with pagination
exports.getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = knex("patients")
            .select("*")
            .where(function () {
                this.where('name', 'like', `%${search}%`)
                    // .orWhere('last_name', 'like', `%${search}%`)
                    .orWhere('patient_id', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('phone', 'like', `%${search}%`);
            })
            .orderBy("created_at", "desc");

        // Get total count for pagination
        const totalQuery = knex("patients")
            .count("* as total")
            .where(function () {
                this.where('name', 'like', `%${search}%`)
                    .orWhere('last_name', 'like', `%${search}%`)
                    .orWhere('patient_id', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('phone', 'like', `%${search}%`);
            })
            .first();

        const [patients, total] = await Promise.all([
            query.limit(limit).offset(offset),
            totalQuery
        ]);

        return res.status(200).json({
            success: true,
            data: patients,
            pagination: {
                total: total.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total.total / limit)
            }
        });

    } catch (error) {
        console.error("Error getting patients:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve patients"
        });
    }
};

// Get a single patient by ID
exports.getPatient = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is a valid number or patient ID string
        const isNumericId = !isNaN(id);

        const patient = await knex("patients")
            .where(isNumericId ? { id } : { patient_id: id })
            .first();

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Get patient's medical records if needed
        const medicalRecords = await knex("medical_records")
            .where("patient_id", patient.id)
            .orderBy("record_date", "desc");

        // Get patient's appointments if needed
        const appointments = await knex("appointments")
            .where("patient_id", patient.id)
            .orderBy("appointment_date", "desc");

        return res.status(200).json({
            success: true,
            data: {
                ...patient,
                medicalRecords,
                appointments
            }
        });

    } catch (error) {
        console.error("Error getting patient:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve patient"
        });
    }
};

// Update a patient
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientData = req.body;

        // Check if patient exists
        const existingPatient = await knex("patients")
            .where({ id })
            .first();

        if (!existingPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Check if email is being updated and already exists for another patient
        if (patientData.email && patientData.email !== existingPatient.email) {
            const emailExists = await knex("patients")
                .where({ email: patientData.email })
                .whereNot({ id })
                .first();

            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email already in use by another patient"
                });
            }
        }

        // Prepare update data
        const updateData = {
            name: patientData.name || existingPatient.name,
            // last_name: patientData.lastName || existingPatient.last_name,
            date_of_birth: patientData.dateOfBirth || existingPatient.date_of_birth,
            gender: patientData.gender || existingPatient.gender,
            email: patientData.email || existingPatient.email,
            phone: patientData.phone || existingPatient.phone,
            address: patientData.address || existingPatient.address,
            medical_history: patientData.medicalHistory || existingPatient.medical_history,
            allergies: patientData.allergies || existingPatient.allergies,
            blood_type: patientData.bloodType || existingPatient.blood_type,
            updated_at: new Date()
        };

        // Handle thumbnail update if provided
        if (patientData.thumbnail) {
            // Delete old thumbnail from S3 if exists
            if (existingPatient.patient_thumbnail) {
                try {
                    const key = existingPatient.patient_thumbnail.split("/").pop();
                    await deleteObject(key);
                } catch (error) {
                    console.error("Error deleting old thumbnail:", error);
                }
            }
            updateData.patient_thumbnail = patientData.thumbnail;
        }

        // Update patient record
        await knex("patients")
            .where({ id })
            .update(updateData);

        return res.status(200).json({
            success: true,
            message: "Patient updated successfully"
        });

    } catch (error) {
        console.error("Error updating patient:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update patient"
        });
    }
};


