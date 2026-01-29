const express = require("express");
const router = express.Router();
const multer = require("multer");
const authenticate = require("../Authentication/auth");

const {
  allOrgPatients,
  saveWard,
  allWardsByOrg,
  deleteWards,
  getWardById,
  updateWard,
  startWardSession,
  getWardSession,
  getAvailableUsers,
  getActiveWardSession,
  getAllWardSession,
  deleteSessions,
} = require("../controllers/wardController");

router.get("/allOrgPatients/:orgId", authenticate, allOrgPatients);
router.post("/saveWard", authenticate, saveWard);
router.get("/getAllWards/:orgId", authenticate, allWardsByOrg);
router.delete("/deleteWards/:id", authenticate, deleteWards);
router.get("/getWard/:id", authenticate, getWardById);
router.put("/updateWards/:id", authenticate, updateWard);
router.post("/startWardSession", authenticate, startWardSession);
router.get("/getWardSession/:sessionId", getWardSession);
router.get("/getAvailableUsers/:orgId", authenticate, getAvailableUsers);
router.get("/getActiveWardSession/:orgId", authenticate, getActiveWardSession);
router.get("/getAllWardSession", authenticate, getAllWardSession);
router.post("/deleteSessions", authenticate, deleteSessions);

module.exports = router;
