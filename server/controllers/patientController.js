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

        const fieldsToSelect = [
            "id",
            "name",
            "email",
            "phone",
            "gender",
            "date_of_birth",
            "category",
            "created_at"
        ];

        let query = knex("patient_records")
            .select(fieldsToSelect)
            .where(function () {
                this.whereNull("deleted_at").orWhere("deleted_at", "");
            });

        if (search.trim() !== "") {
            query.andWhere(function () {
                this.where("name", "like", `%${search}%`)
                    .orWhere("email", "like", `%${search}%`)
                    .orWhere("phone", "like", `%${search}%`);
            });
        }

        query.orderBy("created_at", "desc");

        let totalQuery = knex("patient_records")
            .where(function () {
                this.whereNull("deleted_at").orWhere("deleted_at", "");
            });

        if (search.trim() !== "") {
            totalQuery.andWhere(function () {
                this.where("name", "like", `%${search}%`)
                    .orWhere("email", "like", `%${search}%`)
                    .orWhere("phone", "like", `%${search}%`);
            });
        }

        totalQuery = totalQuery.count("* as total").first();

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

    try {
        const patient = await knex("patient_records")
            .select(
                "id",
                "name",
                "date_of_birth",
                "gender",
                "category",
                "ethnicity",
                "height",
                "weight",
                "email",
                "phone",
                "scenario_location",
                "room_type",
                "address",
                "social_economic_history",
                "family_medical_history",
                "lifestyle_and_home_situation",
                "medical_equipment",
                "pharmaceuticals",
                "diagnostic_equipment",
                "blood_tests",
                "initial_admission_observations",
                "expected_observations_for_acute_condition",
                "patient_assessment",
                "recommended_observations_during_event",
                "observation_results_recovery",
                "observation_results_deterioration",
                "recommended_diagnostic_tests",
                "treatment_algorithm",
                "correct_treatment",
                "expected_outcome",
                "healthcare_team_roles",
                "team_traits"
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
            .andWhere("deleted_at", null)
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
                    message: "Email already exists for another patient",
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
            updated_at: new Date(),
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





