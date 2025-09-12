const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const authenticate = require("../Authentication/auth");

const {
  createOrg,
  getAllOrganisation,
  deleteOrganisation,
  getOrg,
  editOrganisation,
  getUsersByOrganisation,
  checkInstitutionName,
  addRequest,
  getAllRequests,
  requestById,
  approveRequest,
  rejectRequest,
  addMail,
  getAllMail,
  updateMailStatus,
  checkEmail,
  checkUsername,
  library,
} = require("../controllers/orgController");

router.post("/createOrg", authenticate, createOrg);

router.get("/getAllOrganisation", authenticate, getAllOrganisation);
router.delete("/deleteOrg", authenticate, deleteOrganisation);
router.get("/getOrg/:id", authenticate, getOrg);
router.post("/editOrganisation", authenticate, editOrganisation);
router.get("/getUsersByOrganisation/:id", authenticate, getUsersByOrganisation);
router.get("/checkInstitutionName/:name", checkInstitutionName);
router.get("/checkEmail/:email", checkEmail);
router.get("/checkUsername/:username", checkUsername);
router.post("/addRequest", upload.single("thumbnail"), addRequest);
router.get("/getAllRequests", authenticate, getAllRequests);
router.get("/requestById/:id", authenticate, requestById);
router.post("/approveRequest/:id", approveRequest);
router.post("/rejectRequest/:id", authenticate, rejectRequest);
router.post("/rejectRequest/:id", authenticate, rejectRequest);
router.post("/addMail", authenticate, addMail);
router.get("/getAllMail", authenticate, getAllMail);
router.put("/updateMailStatus", authenticate, updateMailStatus);
router.get("/library/:username/:investId", authenticate, library);

module.exports = router;
