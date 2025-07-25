const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  sendNotificationToFaculties,
  sendNotificationToAdmin
} = require("../controllers/notificationController");

router.post("/sendNotificationToFaculties", authenticate, sendNotificationToFaculties);
router.post("/sendNotificationToAdmin", authenticate, sendNotificationToAdmin);

module.exports = router;
