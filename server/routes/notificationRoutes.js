const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer();

const {
  sendNotificationToFaculties,
} = require("../controllers/notificationController");

router.post("/sendNotificationToFaculties", authenticate, sendNotificationToFaculties);

module.exports = router;
