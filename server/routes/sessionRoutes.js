const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  createSession,
  endSession,
  deletePatienSessionData,
} = require("../controllers/sessionController");

router.post("/createSession", authenticate, createSession);
router.put("/endSession/:id", endSession);
router.post("/deletePatienSessionData/:id", deletePatienSessionData);

module.exports = router;
