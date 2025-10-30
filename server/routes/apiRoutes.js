const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const authenticate = require("../Authentication/auth");
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
    getInvestigationReportData
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
router.get("/api/getAllCategoriesInvestigationsById", getAllCategoriesInvestigationsById);
router.post("/api/saveRequestedInvestigations", saveRequestedInvestigations);
router.get("/api/getInvestigationsReportById", getInvestigationsReportById);
router.get("/api/getInvestigationReportData", getInvestigationReportData);




module.exports = router;


