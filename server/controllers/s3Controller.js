require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const ApkReader = require("node-apk-parser");

const s3 = new S3Client({
  region: process.env.AWS_S3_BUCKET_RegionName,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
});

function generateRandomString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

exports.extractPackageName = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No APK file uploaded." });
    }

    const apkPath = req.file.path;

    const reader = ApkReader.readFile(apkPath);
    const manifest = reader.readManifestSync();

    fs.unlinkSync(apkPath);
    return res.json({
      packageName: manifest.package,
      versionCode: manifest.versionCode,
      versionName: manifest.versionName,
      label: manifest.label,
    });
  } catch (error) {
    console.error("Failed to extract package name:", error);
    return res.status(500).json({ error: "Failed to extract package name." });
  }
};

exports.presignedUrl = async (req, res) => {
  const { name, type, size } = req.query;

  if (!name || !type || !size) {
    return res
      .status(400)
      .json({ error: "Missing required parameters: name, type, size" });
  }

  const maxSize = 1024 * 1024 * 1024;
  if (parseInt(size) > maxSize) {
    return res.status(400).json({ error: "File size exceeds 1GB limit" });
  }

  const allowedTypes = [
    "application/vnd.android.package-archive",
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo",
    "application/json",
  ];

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: "Unsupported file type" });
  }

  const sanitizedName = `${generateRandomString()}-${name.replace(
    /[^a-zA-Z0-9_.-]/g,
    ""
  )}`;

  let prefix;
  if (type.includes("video")) {
    prefix = "video/";
  } else if (type.includes("image")) {
    prefix = "image/";
  } else if (type === "application/pdf") {
    prefix = "pdf/";
  } else if (type === "application/vnd.android.package-archive") {
    prefix = "apk/";
  } else {
    prefix = "uploads/";
  }

  const fileKey = `${prefix}${generateRandomString()}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: type,
    ACL: "public-read",
  });

  try {
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 60 * 15, // 15 minutes
    });

    res.json({
      presignedUrl,
      fileKey,
      url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_BUCKET_RegionName}.amazonaws.com/${fileKey}`,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({
      error: "Failed to generate upload URL",
      details: error.message,
    });
  }
};
