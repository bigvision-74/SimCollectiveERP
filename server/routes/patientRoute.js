const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // Handles multipart/form-data without files

const authenticate = require("../Authentication/auth");
const {
  createPatient,
  getAllPatients,
  getUserReport,
  addInvestigation,
  addNewMedication,
  updateMedication,
  deleteMedication,
  deletePatients,
  getPatientById,
  updatePatient,
  checkEmailExists,
  addPatientNote,
  getPatientNotesById,
  updatePatientNote,
  addObservations,
  getObservationsById,
  updateObservations,
  updateFluidBalance,
  getObservationsByTableId,
  getFluidByTableId,
  getFluidBalanceById,
  getFluidBalanceById1,
  assignPatients,
  getAssignedPatients,
  getInvestigations,
  saveRequestedInvestigations,
  getRequestedInvestigationsById,
  getPatientsByUserOrg,
  generateAIPatient,
  saveParamters,
  saveGeneratedPatients,
  getAllRequestInvestigations,
  getPatientRequests,
  getCategory,
  getInvestigationParams,
  submitInvestigationResults,
  saveFluidBalance,
  getFluidBalanceByPatientId,
  getUserReportsListById,
  getInvestigationReports,
  getAllTypeRequestInvestigation,
  updateCategory,
  deletetestparams,
  updateParams,
  deletePatientNote,
  deletePrescription,
  deleteObservation,
  deleteFluidBalance,
  addPrescription,
  getPrescriptionsByPatientId,
  getPrescriptionsById,
  updatePrescription,
  getAllPublicPatients,
  getReportTemplates,
  getAllMedications,
  getActivePatients,
  getImageTestsByCategory,
  uploadImagesToLibrary,
  getImagesByInvestigation,
  getExportData,
  getPatientsByOrgId,
  requestedParameters,
  manageRequest,
  getAllInvestigations,
  deleteInvestigation,
  updateInvestigationResult,
  deleteInvestigationReport,
  addComments,
  updateComments,
  deleteComments,
  generateObservations,
  saveTemplate,
  getTemplates,
  getInvestigationsByCategory, deleteTemplate
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
router.get("/getUserReport", authenticate, getUserReport);
router.delete("/deletePatient", authenticate, express.json(), deletePatients);
router.get("/getPatientById/:id", authenticate, getPatientById);
router.put("/updatePatient/:id", authenticate, express.json(), updatePatient);
router.get("/check-email-exists", checkEmailExists);
router.post("/addNote", authenticate, express.json(), addPatientNote);
router.post(
  "/addNewMedication",
  authenticate,
  express.json(),
  addNewMedication
);
router.delete(
  "/deleteMedication/:id",
  authenticate,
  express.json(),
  deleteMedication
);
router.post(
  "/updateMedication",
  authenticate,
  express.json(),
  updateMedication
);
router.get(
  "/getPatientNotesById/:patientId/:orgId",
  authenticate,
  getPatientNotesById
);
router.post(
  "/getUserReportsListById/:patientId/:orgId",
  authenticate,
  getUserReportsListById
);
router.put("/updatePatientNote/:id", authenticate, updatePatientNote);
router.post("/addObservations", authenticate, addObservations);
router.get(
  "/getObservationsById/:patientId/:orgId",
  authenticate,
  getObservationsById
);
router.get(
  "/getObservationsByTableId/:obsId",
  authenticate,
  getObservationsByTableId
);
router.get("/getFluidByTableId/:FluidId", authenticate, getFluidByTableId);
router.get(
  "/getFluidBalanceById/:patientId/:orgId",
  authenticate,
  getFluidBalanceById
);
router.get(
  "/getFluidBalanceById1/:patientId/:orgId",
  authenticate,
  getFluidBalanceById1
);
router.post("/assignPatients", authenticate, assignPatients);
router.post("/updateObservations", authenticate, updateObservations);
router.post("/updateFluidBalance", authenticate, updateFluidBalance);
router.post(
  "/submitInvestigationResults",
  authenticate,
  submitInvestigationResults
);
router.get("/getAssignedPatients/:userId", authenticate, getAssignedPatients);
router.get("/getInvestigations/:id", authenticate, getInvestigations);
router.get("/getPatientRequests/:userId", authenticate, getPatientRequests);
router.get("/getInvestigationParams/:id", authenticate, getInvestigationParams);
router.post(
  "/getInvestigationReports/:patientId/:investigationId/:orgId",
  authenticate,
  getInvestigationReports
);
// router.post("/getInvestigationReports/:patientId/:investigationId/:orgId", authenticate, getInvestigationReports);
router.get(
  "/getAllRequestInvestigations",
  authenticate,
  getAllRequestInvestigations
);

router.get("/getCategory", authenticate, getCategory);
router.get(
  "/getInvestigationsByCategory/:category_id",
  authenticate,
  getInvestigationsByCategory
);
router.post(
  "/saveRequestedInvestigations/:sessionId",
  authenticate,
  saveRequestedInvestigations
);
router.get(
  "/getRequestedInvestigationsById/:patientId/:orgId",
  authenticate,
  getRequestedInvestigationsById
);
router.get("/getPatientsByUserOrg/:userId", authenticate, getPatientsByUserOrg);
router.get("/getPatientsByOrgId/:orgId", authenticate, getPatientsByOrgId);
router.post("/generateAIPatient", authenticate, generateAIPatient);
router.post("/saveParamters", authenticate, upload.none(), saveParamters);
router.post("/saveGeneratedPatients", authenticate, saveGeneratedPatients);
router.post("/saveFluidBalance", authenticate, saveFluidBalance);
router.get(
  "/getFluidBalanceByPatientId/:patient_id/:orgId",
  authenticate,
  getFluidBalanceByPatientId
);
router.get(
  "/getAllTypeRequestInvestigation",
  authenticate,
  getAllTypeRequestInvestigation
);
router.post("/updateCategory", authenticate, updateCategory);
router.post("/updateParams", authenticate, updateParams);
router.delete("/deletetestparams/:id", authenticate, deletetestparams);
router.get(
  "/getAllTypeRequestInvestigation",
  authenticate,
  getAllTypeRequestInvestigation
);
router.delete("/deletePatientNote/:id", authenticate, deletePatientNote);
router.delete("/deletePrescription/:id", authenticate, deletePrescription);
router.delete("/deleteObservation/:id", authenticate, deleteObservation);
router.delete("/deleteFluidBalance/:id", authenticate, deleteFluidBalance);
router.post("/updateCategory", authenticate, updateCategory);
router.post("/addPrescription", authenticate, addPrescription);
router.get(
  "/getPrescriptionsByPatientId/:id/:orgId",
  authenticate,
  getPrescriptionsByPatientId
);
router.get(
  "/getPrescriptionsById/:prescriptionId",
  authenticate,
  getPrescriptionsById
);
router.put("/updatePrescription/:id", authenticate, updatePrescription);
router.get("/getAllPublicPatients", authenticate, getAllPublicPatients);
router.get("/getReportTemplates", authenticate, getReportTemplates);
router.get("/getAllMedications", authenticate, getAllMedications);
router.get("/getActivePatients", authenticate, getActivePatients);
router.get("/getImageTestsByCategory", authenticate, getImageTestsByCategory);
router.post("/uploadImagesToLibrary", authenticate, uploadImagesToLibrary);
router.get(
  "/getImagesByInvestigation/:investigation_id",
  authenticate,
  getImagesByInvestigation
);
router.get("/getExportData/:id", authenticate, getExportData);

router.get("/requestedParameters", authenticate, requestedParameters);
router.post("/manageRequest", authenticate, manageRequest);
router.get("/getAllInvestigations", authenticate, getAllInvestigations);
router.post("/deleteInvestigation", authenticate, deleteInvestigation);
router.put(
  "/updateInvestigationResult",
  authenticate,
  updateInvestigationResult
);
router.post(
  "/deleteInvestigationReport",
  authenticate,
  deleteInvestigationReport
);
router.post("/addComments", authenticate, addComments);
router.put("/updateComments", authenticate, updateComments);
router.delete("/deleteComments/:id", authenticate, deleteComments);
router.post("/generateObservations", authenticate, generateObservations);
router.post("/saveTemplate", authenticate, saveTemplate);
router.get("/getTemplates/:investigation_id", authenticate, getTemplates);
router.delete("/deleteTemplate/:id", authenticate, deleteTemplate);
// router.post("/stopMedication", authenticate, stopMedication);

module.exports = router;
