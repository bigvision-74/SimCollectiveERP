const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");

const {
  getStatsAndCount,
  getorganisation,
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
  weakAreas
} = require("../controllers/adminController");

router.get("/getStatsAndCount/:username", authenticate, getStatsAndCount);
router.get("/getorganisation/:username", getorganisation);
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
router.put("/updateLanguageStatus", authenticate, updateLanguageStatus);
router.post("/contact", contactEmail);
router.get("/weakAreas/:org", authenticate, weakAreas);

module.exports = router;
