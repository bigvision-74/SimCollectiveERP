const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  createSession,
  addParticipant,
  endSession,
  deletePatienSessionData,
  endUserSession,
} = require("../controllers/sessionController");

router.post("/createSession", authenticate, createSession);
router.post("/addParticipant", authenticate, addParticipant);
router.put("/endSession/:id", endSession);
router.post("/deletePatienSessionData/:id", deletePatienSessionData);
router.post("/endUserSession/:sessionId/:userid", endUserSession);

module.exports = router;
