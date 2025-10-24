const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const { addVirtualSection, getAllVirtualSections, getVrSessionById,deleteVirtualSession } = require("../controllers/virtualController");

// Add a new virtual session
router.post("/addVirtualSection", authenticate, upload.none(), addVirtualSection);
router.get("/getAllVirtualSections", authenticate, getAllVirtualSections);
router.get("/getVrSessionById/:sessionId", authenticate, getVrSessionById);
router.delete("/deleteVirtualSession/:id", authenticate, deleteVirtualSession);
// router.get("/virtual-section/:user_id", authenticate, getVirtualSectionsByUser);

module.exports = router;
