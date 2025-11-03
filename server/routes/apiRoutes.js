const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const authenticate = require("../Authentication/auth");
<<<<<<< HEAD
const {
  Login,
  sendOtp,
  verify,
  getAllPatients,
  getVirtualSessionByUserId,
  getPatientSummaryById,
  getPatientNoteById,
  addOrUpdatePatientNote,
  deleteNoteById,
  getAllCategoriesInvestigationsById,
  saveRequestedInvestigations,
  getInvestigationsReportById,
  getInvestigationReportData,
  getPrescriptionsDataById,
  getAllMedicationsList,
  addPrescriptionApi,
  savefcmToken,
=======
const { Login,
    sendOtp,
    verify,
    getAllPatients,
    getVirtualSessionByUserId,
    getPatientSummaryById,
    getPatientNoteById,
    addOrUpdatePatientNote,
    deleteNoteById,
    getAllCategoriesInvestigationsById,
    saveRequestedInvestigations,
    getInvestigationsReportById,
    getInvestigationReportData,
    getPrescriptionsDataById,
    getAllMedicationsList,
    addPrescriptionApi,
    getActiveSessionsList,
    updateProfileApi
>>>>>>> 24ffcd336a9bc840fd965c86a38aecc2b01b88b8
} = require("../controllers/apiController");

router.post("/api/login", Login);
router.post("/api/sendOtp", sendOtp);
router.post("/api/verify", verify);
router.get("/api/getAllPatients", getAllPatients);
router.post("/api/getVirtualSessionByUserId", getVirtualSessionByUserId);
router.get("/api/getPatientSummaryById", getPatientSummaryById);
router.get("/api/getPatientNoteById", getPatientNoteById);
router.post("/api/addOrUpdatePatientNote", addOrUpdatePatientNote);
router.post("/api/deleteNoteById", deleteNoteById);
router.get(
  "/api/getAllCategoriesInvestigationsById",
  getAllCategoriesInvestigationsById
);
router.post("/api/saveRequestedInvestigations", saveRequestedInvestigations);
router.get("/api/getInvestigationsReportById", getInvestigationsReportById);
router.get("/api/getInvestigationReportData", getInvestigationReportData);
router.get("/api/getPrescriptionsDataById", getPrescriptionsDataById);
router.get("/api/getAllMedicationsList", getAllMedicationsList);
router.post("/api/addPrescriptionApi", addPrescriptionApi);
<<<<<<< HEAD
router.post("/api/savefcmToken", savefcmToken);
=======
router.get("/api/getActiveSessionsList", getActiveSessionsList);
router.post("/api/updateProfileApi", updateProfileApi);



>>>>>>> 24ffcd336a9bc840fd965c86a38aecc2b01b88b8

module.exports = router;
