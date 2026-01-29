const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  createSession,
  addParticipant,
  endSession,
  getAllActiveSessions,
  deletePatienSessionData,
  endUserSession,
  getAllSession,
  deleteIndividualSessions
} = require("../controllers/sessionController");

router.post("/createSession", authenticate, createSession);
router.post("/addParticipant", authenticate, addParticipant);
router.get("/getAllActiveSessions/:orgId", authenticate, getAllActiveSessions);
router.put("/endSession/:id/:endedBy", endSession);
router.post("/deletePatienSessionData/:id", deletePatienSessionData);
router.post("/endUserSession/:sessionId/:userid", endUserSession);
router.get("/getAllSession", authenticate, getAllSession);
router.post("/deleteIndividualSessions", authenticate, deleteIndividualSessions);

module.exports = router;
