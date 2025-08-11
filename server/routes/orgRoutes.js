const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = require("../helpers/fileUploadHelper");
const authenticate = require("../Authentication/auth");

const {
  createOrg,
  getAllOrganisation,
  deleteOrganisation,
  getOrg,
  editOrganisation,
  getUsersByOrganisation,
  checkInstitutionName
} = require("../controllers/orgController");

router.post("/createOrg", authenticate, createOrg);

router.get("/getAllOrganisation", authenticate, getAllOrganisation);
router.delete("/deleteOrg", authenticate, deleteOrganisation);
router.get("/getOrg/:id", authenticate, getOrg);
router.post("/editOrganisation", authenticate, editOrganisation);
router.get("/getUsersByOrganisation/:id", authenticate, getUsersByOrganisation);
router.get("/checkInstitutionName/:name", authenticate, checkInstitutionName);

module.exports = router;
