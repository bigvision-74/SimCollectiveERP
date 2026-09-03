<<<<<<< HEAD
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
  getSessionByUserId,
  getSessionDetails1,
  deletePatienSessionData,
  endUserSession,
  getAllSession,
  deleteIndividualSessions,
  checkActiveSessionForPatient
} = require("../controllers/sessionController");

router.post("/createSession", authenticate, createSession);
router.post("/addParticipant", authenticate, addParticipant);
router.get("/getAllActiveSessions/:orgId", authenticate, getAllActiveSessions);
router.get("/checkActiveSession/:orgId", authenticate, checkActiveSessionForPatient);
router.get("/getSessionByUserId/:userId", authenticate, getSessionByUserId);
router.get("/getSessionDetails1/:sessionId", authenticate, getSessionDetails1);
router.put("/endSession/:id/:endedBy", endSession);
router.post("/deletePatienSessionData/:id", deletePatienSessionData);
router.post("/endUserSession/:sessionId/:userid", endUserSession);
router.get("/getAllSession", authenticate, getAllSession);
router.post("/deleteIndividualSessions", authenticate, deleteIndividualSessions);

module.exports = router;
=======
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
  getSessionByUserId,
  deletePatienSessionData,
  endUserSession,
  getAllSession,
  deleteIndividualSessions
} = require("../controllers/sessionController");

router.post("/createSession", authenticate, createSession);
router.post("/addParticipant", authenticate, addParticipant);
router.get("/getAllActiveSessions/:orgId", authenticate, getAllActiveSessions);
router.get("/getSessionByUserId/:userId", authenticate, getSessionByUserId);
router.put("/endSession/:id/:endedBy", endSession);
router.post("/deletePatienSessionData/:id", deletePatienSessionData);
router.post("/endUserSession/:sessionId/:userid", endUserSession);
router.get("/getAllSession", authenticate, getAllSession);
router.post("/deleteIndividualSessions", authenticate, deleteIndividualSessions);

module.exports = router;
>>>>>>> refs/remotes/origin/main
