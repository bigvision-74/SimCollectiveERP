const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const authenticate = require("../Authentication/auth");
const { Login, verifyApi, getAllPatientsApi, getVirtualSessionByUserIdApi } = require("../controllers/apiController");

router.post("/login", Login);
router.post("/verifyApi", verifyApi);
router.get("/getAllPatientsApi", getAllPatientsApi);
// router.get("/patient-report", getPatientReport);
router.post("/getVirtualSessionByUserIdApi", getVirtualSessionByUserIdApi);

module.exports = router;
