const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  sendNotificationToFaculties,
  sendNotificationToAllAdmins,
  sendNotificationToAddNote,
  sendNotificationToAdmin
} = require("../controllers/notificationController");

router.post("/sendNotificationToFaculties", authenticate, sendNotificationToFaculties);
router.post("/sendNotificationToAllAdmins", authenticate, sendNotificationToAllAdmins);
router.post("/sendNotificationToAddNote", authenticate, sendNotificationToAddNote);
router.post("/sendNotificationToAdmin", authenticate, sendNotificationToAdmin);

module.exports = router;
