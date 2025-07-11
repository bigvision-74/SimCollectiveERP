const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // Handles multipart/form-data without files

const authenticate = require("../Authentication/auth");
const { createPatient, getAllPatients, deletePatients, getPatientById, updatePatient, checkEmailExists, addPatientNote, getPatientNotesById, updatePatientNote } = require("../controllers/patientController");

// FIXED ROUTE:
router.post("/createPatient", authenticate, upload.none(), createPatient);
router.get("/getAllPatients", authenticate, getAllPatients);
router.delete("/deletePatient", authenticate, express.json(), deletePatients);
router.get("/getPatientById/:id", authenticate, getPatientById);
router.put("/updatePatient/:id", authenticate, express.json(), updatePatient);
router.get("/check-email-exists", checkEmailExists);
router.post("/addNote", authenticate, express.json(), addPatientNote);
router.get("/getPatientNotesById/:id", authenticate, getPatientNotesById);
router.put("/updatePatientNote/:id", authenticate, updatePatientNote);



module.exports = router;
