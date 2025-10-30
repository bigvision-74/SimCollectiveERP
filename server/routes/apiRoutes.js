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

router.post("/login", Login);
router.post("/sendOtp", sendOtp);
router.post("/verify", verify);
router.get("/getAllPatients", getAllPatients);
router.post("/getVirtualSessionByUserId", getVirtualSessionByUserId);
router.get("/getPatientSummaryById", getPatientSummaryById);
router.get("/getPatientNoteById", getPatientNoteById);
router.post("/addOrUpdatePatientNote", addOrUpdatePatientNote);
router.post("/deleteNoteById", deleteNoteById);
router.get("/getAllCategoriesInvestigationsById", getAllCategoriesInvestigationsById);
router.post("/saveRequestedInvestigations", saveRequestedInvestigations);
router.get("/getInvestigationsReportById", getInvestigationsReportById);
router.get("/getInvestigationReportData", getInvestigationReportData);




module.exports = router;


