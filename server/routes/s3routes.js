const express = require("express");
const router = express.Router();
const authenticate = require("../Authentication/auth");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
presignedUrl,
extractPackageName
} = require("../controllers/s3Controller");


router.get("/generate-presigned-url", authenticate, presignedUrl);
router.post("/extract-apk-package", authenticate, upload.single("apk"), extractPackageName);

module.exports = router;