const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // Handles multipart/form-data without files

const authenticate = require("../Authentication/auth");
const {
  createPatient,
  getAllPatients,
  addInvestigation,
  deletePatients,
  getPatientById,
  updatePatient,
  checkEmailExists,
  addPatientNote,
  getPatientNotesById,
  updatePatientNote,
  addObservations,
  getObservationsById,
  assignPatients,
  getAssignedPatients,
  getInvestigations,
  saveRequestedInvestigations,
  getRequestedInvestigationsById,
  getPatientsByUserOrg,
  generateAIPatient,
  saveGeneratedPatients,
  getAllRequestInvestigations,
  getPatientRequests,
  getCategory,
  getInvestigationParams,
  submitInvestigationResults,
  saveFluidBalance,
  getFluidBalanceByPatientId
} = require("../controllers/patientController");

// FIXED ROUTE:
router.post("/createPatient", authenticate, upload.none(), createPatient);
router.post(
  "/addInvestigation",
  authenticate,
  express.json(),
  addInvestigation
);
router.get("/getAllPatients", authenticate, getAllPatients);
router.delete("/deletePatient", authenticate, express.json(), deletePatients);
router.get("/getPatientById/:id", authenticate, getPatientById);
router.put("/updatePatient/:id", authenticate, express.json(), updatePatient);
router.get("/check-email-exists", checkEmailExists);
router.post("/addNote", authenticate, express.json(), addPatientNote);
router.get("/getPatientNotesById/:id", authenticate, getPatientNotesById);
router.put("/updatePatientNote/:id", authenticate, updatePatientNote);
router.post("/addObservations", authenticate, addObservations);
router.get("/getObservationsById/:id", authenticate, getObservationsById);
router.post("/assignPatients", authenticate, assignPatients);
router.post("/submitInvestigationResults", authenticate, submitInvestigationResults);
router.get("/getAssignedPatients/:userId", authenticate, getAssignedPatients);
router.get("/getInvestigations", authenticate, getInvestigations);
router.get("/getPatientRequests/:userId", authenticate, getPatientRequests);
router.get("/getInvestigationParams/:id", authenticate, getInvestigationParams);
router.get(
  "/getAllRequestInvestigations",
  authenticate,
  getAllRequestInvestigations
);
router.get("/getCategory", authenticate, getCategory);
router.post(
  "/saveRequestedInvestigations",
  authenticate,
  saveRequestedInvestigations
);
router.get(
  "/getRequestedInvestigationsById/:patientId",
  authenticate,
  getRequestedInvestigationsById
);
router.get("/getPatientsByUserOrg/:userId", authenticate, getPatientsByUserOrg);
router.post("/generateAIPatient", authenticate, generateAIPatient);
router.post("/saveGeneratedPatients", authenticate, saveGeneratedPatients);
router.post("/saveFluidBalance", authenticate, saveFluidBalance);
router.get("/getFluidBalanceByPatientId/:patient_id", authenticate, getFluidBalanceByPatientId);

module.exports = router;
