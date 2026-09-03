const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // Handles multipart/form-data without files

const authenticate = require("../Authentication/auth");
const { saveSettings, getSettings, updatePlan, getPlans } = require("../controllers/settingController");


router.post("/saveSettings", authenticate, upload.none(), saveSettings);
router.get("/getSettings", getSettings);
router.put("/updatePlan", authenticate, upload.none(), updatePlan);
router.get("/getPlans", authenticate, getPlans);

module.exports = router;