const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const authenticate = require("../Authentication/auth");
const { Login, getAllPatients,getPatientReport } = require("../controllers/apiController");

router.post("/login", Login);
router.get("/all-patients", getAllPatients);
router.get("/patient-report", getPatientReport);

module.exports = router;
