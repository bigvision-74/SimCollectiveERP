const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // Handles multipart/form-data without files

const authenticate = require("../Authentication/auth");
const { saveSettings, getSettings } = require("../controllers/settingController");


router.post("/saveSettings", authenticate, upload.none(), saveSettings);
router.get("/getSettings", getSettings);

module.exports = router;