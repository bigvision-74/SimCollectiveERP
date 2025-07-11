const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
require("dotenv").config();


// Create a new patient
exports.createPatient = async (req, res) => {
    const patientData = req.body;
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
            organisation_id: patientData.organisation_id || null,
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

exports.getAllPatients = async (req, res) => {
    try {
        const patientRecords = await knex("patient_records")
            .select(
                "patient_records.*"
            )
            .where("deleted_at", "!=", "deleted")

            .orderBy("id", "desc");

        res.status(200).send(patientRecords);
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
        return res.status(400).json({ exists: false, message: "Email is required" });
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
    // const doctor_id = req.user?.id;
    console.log("Authenticated user:", req.user);

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
        const updated = await knex("patient_notes")
            .where({ id: noteId })
            .update({
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

        const updatedNote = await knex("patient_notes").where({ id: noteId }).first();

        return res.status(200).json(updatedNote);
    } catch (error) {
        console.error("Error updating patient note:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update note",
        });
    }
};




