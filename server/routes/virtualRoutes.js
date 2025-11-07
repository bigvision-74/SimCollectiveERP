const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const { addVirtualSection, getAllVirtualSections, getVrSessionById, deleteVirtualSession, saveVirtualSessionData, scheduleSocketSession, getScheduledSockets } = require("../controllers/virtualController");

// Add a new virtual session
router.post("/addVirtualSection", authenticate, upload.none(), addVirtualSection);
router.get("/getAllVirtualSections", authenticate, getAllVirtualSections);
router.get("/getVrSessionById/:patientId", authenticate, getVrSessionById);
router.get("/getScheduledSockets/:sessionId", authenticate, getScheduledSockets);
router.delete("/deleteVirtualSession/:id", authenticate, deleteVirtualSession);
router.post("/saveVirtualSessionData", authenticate, saveVirtualSessionData);
router.post("/scheduleSocketSession", authenticate, scheduleSocketSession);
// router.get("/virtual-section/:user_id", authenticate, getVirtualSectionsByUser);

module.exports = router;
