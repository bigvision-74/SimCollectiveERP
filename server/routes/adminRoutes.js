const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  getStatsAndCount,
  getFacultiesById,
  getAdminsById,
  getorganisation,
  getOrganisationById,
  getUserActivity,
  getUserCourse,
  resetPassword,
  addNotifications,
  allNotifications,
  deleteNotifications,
  updateNotifications,
  getSearchData,
  demoEmail,
  dataAccordingTomonth,
  getUserAssignedCourses,
  getAllLanguage,
  updateLanguageStatus,
  contactEmail,
  addLanguage,
  weakAreas,
  getAllOrganisations,
  addSharedOrg, 
  getActivityLogs, 
  deleteActivityLogs, 
  getCardsInfo,
  getPrescriptionsInfo,
  getPendingsRequests,
  getInvestigationRequests,
  getStudentPerformance,
  getActivityOverview,
  getSessionsData
} = require("../controllers/adminController");

router.get("/getStatsAndCount/:username", authenticate, getStatsAndCount);
router.get("/getFacultiesById/:orgId", authenticate, getFacultiesById);
router.get("/getAdminsById/:orgId", authenticate, getAdminsById);
router.get("/getorganisation/:username", getorganisation);
router.get("/getOrganisationById/:orgId", getOrganisationById);
router.get("/getUserActivity/:username", authenticate, getUserActivity);
router.get("/getUserCourse/:username", getUserCourse);
router.post("/resetProfilePassword", authenticate, resetPassword);
router.post("/addNotifications", authenticate, addNotifications);
router.get("/allNotifications/:username", allNotifications);
router.delete("/notifications/:ids", authenticate, deleteNotifications);
router.put("/updateNotifications", updateNotifications);
router.get("/getSearchData", getSearchData);
router.get('/getUserAssignedCourses', authenticate, getUserAssignedCourses)
router.post("/demoEmail", demoEmail);
router.get("/dataAccordingTomonth", authenticate, dataAccordingTomonth); 
router.get("/getAllLanguage", getAllLanguage);
router.post("/addLanguage", authenticate, addLanguage);
router.get("/getAllOrganisations", authenticate, getAllOrganisations);
router.put("/updateLanguageStatus", authenticate, updateLanguageStatus);
router.post("/contact", contactEmail);
router.get("/weakAreas/:org", authenticate, weakAreas);
router.post("/addSharedOrg", authenticate, upload.none(), addSharedOrg);
router.get("/getActivityLogs", authenticate, getActivityLogs);
router.delete("/deleteLogs", authenticate, deleteActivityLogs);
router.get("/getCardsInfo/:userId", getCardsInfo);
router.get("/getPrescriptionsInfo/:userId", getPrescriptionsInfo);
router.get("/getPendingsRequests/:orgId", getPendingsRequests);
router.get("/getInvestigationRequests/:orgId", getInvestigationRequests);
router.get("/getStudentPerformance/:orgId", getStudentPerformance);
router.get("/getActivityOverview/:orgId", getActivityOverview);
router.get("/getSessionsData/:orgId", getSessionsData);

module.exports = router;
