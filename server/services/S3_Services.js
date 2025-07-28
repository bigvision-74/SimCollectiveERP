require("dotenv").config();
const {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const { Upload } = require("@aws-sdk/lib-storage");

const client = new S3Client({
  region: process.env.AWS_S3_BUCKET_RegionName,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },

  requestHandler: {
    httpOptions: {
      timeout: 600000, // 5 minutes
      connectTimeout: 600000,
    }
  }
});

async function uploadFile(file, folderPath = "", userId = "") {
  if (!file || (!file.path && !file.buffer && !file.stream)) {
    throw new Error("Invalid file object - must have path, buffer, or stream");
  }

  const folder = folderPath || "others";
  const uniqueFilename = `${userId}-${file.originalname}`;
  const key = `${folder}/${uniqueFilename}`;

  try {
    let body;
    if (file.buffer) {
      body = file.buffer;
    } else if (file.path) {
      body = fs.createReadStream(file.path);
    } else if (file.stream) {
      body = file.stream;
    }

    const parallelUpload = new Upload({
      client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: body,
        ACL: "public-read",
      },
      queueSize: 10,
      partSize: 10 * 1024 * 1024,
      leavePartsOnError: false,
    });

    await parallelUpload.done();

    return {
      key,
      Location: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_BUCKET_RegionName}.amazonaws.com/${key}`,
    };
  } catch (err) {
    console.error("Multipart Upload Error:", err);
    throw new Error(`Failed to upload file: ${err.message}`);
  } finally {
    if (file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });
    }
  }
}

async function createFolder(folderPath) {
  if (!folderPath) throw new Error("Folder path is required");
  const key = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;
  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Body: "",
    Key: key,
  };
  try {
    const command = new PutObjectCommand(uploadParams);
    await client.send(command);
    return { key: key, message: `Folder ${key} created successfully` };
  } catch (error) {
    throw new Error(`Failed to create folder ${key}: ${error.message}`);
  }
}

async function deleteObject(objectKey) {
  if (!objectKey) throw new Error("Object key is required");
  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: objectKey,
  };
  try {
    const command = new DeleteObjectCommand(deleteParams);
    await client.send(command);
    return { success: true, key: objectKey };
  } catch (error) {
    throw new Error(`Failed to delete object ${objectKey}: ${error.message}`);
  }
}

async function getFileStream(fileKey) {
  if (!fileKey) throw new Error("File key is required");
  const downloadParams = {
    Key: fileKey,
    Bucket: process.env.AWS_S3_BUCKET_NAME,
  };
  try {
    const command = new GetObjectCommand(downloadParams);
    const response = await client.send(command);
    return response.Body;
  } catch (error) {
    throw new Error(`Failed to download file ${fileKey}: ${error.message}`);
  }
}

async function listObjects(prefix = "") {
  const listParams = { Bucket: process.env.AWS_S3_BUCKET_NAME, Prefix: prefix };
  let objects = [];
  let isTruncated = true;
  try {
    while (isTruncated) {
      const command = new ListObjectsV2Command(listParams);
      const response = await client.send(command);
      objects = objects.concat(response.Contents || []);
      isTruncated = response.IsTruncated;
      listParams.ContinuationToken = response.NextContinuationToken;
    }
    return objects.map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
  } catch (error) {
    throw new Error(`Failed to list objects: ${error.message}`);
  }
}

async function getAllBucketObjects() {
  const allObjects = [];
  let continuationToken = null;
  let isTruncated = true;

  try {
    while (isTruncated) {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        ContinuationToken: continuationToken,
      };

      const command = new ListObjectsV2Command(params);
      const response = await client.send(command);

      if (response.Contents && response.Contents.length > 0) {
        allObjects.push(
          ...response.Contents.map((obj) => ({
            Key: obj.Key,
            Size: obj.Size,
            LastModified: obj.LastModified,
            StorageClass: obj.StorageClass || "STANDARD",
          }))
        );
      }

      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    return allObjects;
  } catch (error) {
    throw new Error(`Failed to list bucket objects: ${error.message}`);
  }
}

module.exports = {
  uploadFile,
  deleteObject,
  getFileStream,
  listObjects,
  createFolder,
  getAllBucketObjects,
};
