const express = require("express");
const router = express.Router();
const upload = require("../helpers/fileUploadHelper");
const authenticate = require("../Authentication/auth");


const {
  createUser,
  loginUser,
  getAllUser,
  countUsers,
  getUser,
  getCode,
  verifyUser,
  deleteUser,
  updateUser,
  getAllUsers,
  getUsername,
  passwordLink,
  resetPassword,
  getUserByOrg,
  updateSettings,
  getSetting,
  savePreferenceChanges,
  getPreference,
  AddOnlineUser,
  updateUserIdDelete,
  getOnlineUsers,
  orgOnlineUsers,
  getUserOrgId,
  getEmail,
  leaderboard,
  deleteVrSessionById,
  notifyStudentAtRisk,
  getAllDetailsCount,
  getSubscriptionDetails,
  getAdminAllCount,
  globalSearchData,
  getSuperadmins,
  getAdministrators,
  removeLoginTime,
  createContact,
  getAllContacts,
  getTranslations,
  updateTranslation,
  createFeedbackRequest,
  getFeedbackRequests,
  resendActivationMail
} = require("../controllers/userController");

router.post("/createUser", authenticate, createUser);
router.post("/loginUser", loginUser);
router.get("/getAllUser", authenticate, getAllUser);
router.get("/countUsers", authenticate, countUsers);
router.get("/getUser/:id", getUser);
router.post("/getAdminAllCount/:id", getAdminAllCount);
router.get("/getCode/:id", getCode);
router.get("/getAllUsers", authenticate, getAllUsers);
router.get("/getAllDetailsCount", authenticate, getAllDetailsCount);
router.get("/getSubscriptionDetails", authenticate, getSubscriptionDetails);
router.post("/verifyUser", verifyUser);
router.delete("/deleteUser", authenticate, deleteUser);
router.delete("/deleteVrSessionById/:sessionId", authenticate, deleteVrSessionById);
router.put("/updateUser", authenticate, updateUser);
router.get("/getUsername/:username", authenticate, getUsername);
router.get("/getEmail", authenticate, getEmail);
router.post("/passwordLink", passwordLink);
router.post("/resetPassword", resetPassword);
router.get("/getUserByOrg/:org", authenticate, getUserByOrg);

//settings
router.post("/updateSettings", authenticate, updateSettings);

router.get("/getSetting", getSetting);
router.post("/savePreferenceChanges", authenticate, savePreferenceChanges);
router.get("/getPreference", authenticate, getPreference);
router.post("/addOnlineUser", authenticate, AddOnlineUser);
router.delete("/updateUserIdDelete", updateUserIdDelete);
router.get("/getOnlineUsers", authenticate, getOnlineUsers);
router.get("/orgOnlineUsers/:orgId", authenticate, orgOnlineUsers);
router.get("/leaderboard", leaderboard);
router.post("/notifyStudentAtRisk", authenticate, notifyStudentAtRisk)

//Instructor
router.get("/getUserOrgId", authenticate, getUserOrgId);
router.get("/globalSearchData", globalSearchData)

router.get("/getSuperadmins", authenticate, getSuperadmins)
router.get("/getAdministrators", authenticate, getAdministrators)
router.post("/removeLoginTime", authenticate, removeLoginTime)
router.post("/createContact", createContact)
router.get("/getAllContacts", authenticate, getAllContacts)

// Translation routes
router.get("/getTranslations", authenticate, getTranslations);
router.put("/updateTranslation", authenticate, updateTranslation);

router.post("/createFeedbackRequest", authenticate, createFeedbackRequest);
router.get("/getFeedbackRequests", authenticate, getFeedbackRequests);
router.post("/resendActivationMail", authenticate, resendActivationMail);




module.exports = router;
