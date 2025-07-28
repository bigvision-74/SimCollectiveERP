const AWS = require("aws-sdk");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

class TranscriptionService {
  constructor() {
    this.configureAWS();
    this.transcribeService = new AWS.TranscribeService();
    this.s3 = new AWS.S3();
  }

  configureAWS() {
    try {
      AWS.config.update({
        region: process.env.AWS_S3_BUCKET_RegionName,
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_ACCESS_SECRET,
      });

      if (!process.env.AWS_ACCESS_KEY || !process.env.AWS_ACCESS_SECRET) {
        throw new Error("AWS credentials not configured");
      }
    } catch (error) {
      console.error("AWS Configuration Error:", error);
      throw error;
    }
  }

  async startTranscription(videoUrl, lessonId, moduleId) {
    console.log(`Starting transcription for lesson ${lessonId}`);

    if (!videoUrl.startsWith("https://")) {
      throw new Error(`Invalid video URL: ${videoUrl}`);
    }

    const jobName = `transcription-${moduleId}-${Date.now()}`;
    const outputBucket = process.env.AWS_S3_BUCKET_NAME;

    if (!outputBucket) {
      throw new Error("Transcription output bucket not configured");
    }

    const transcriptionKey = `transcriptions/${jobName}.json`;
    const transcriptionUrl = `https://${outputBucket}.s3.amazonaws.com/${transcriptionKey}`;

    const params = {
      TranscriptionJobName: jobName,
      LanguageCode: "en-US",
      MediaFormat: videoUrl.split(".").pop().toLowerCase(),
      Media: { MediaFileUri: videoUrl },
      OutputBucketName: outputBucket,
      OutputKey: transcriptionKey,
      Settings: {
        ShowSpeakerLabels: false,
      },
    };

    try {
      const data = await this.transcribeService
        .startTranscriptionJob(params)
        .promise();
      console.log(
        "Transcription job started:",
        data.TranscriptionJob.TranscriptionJobName
      );

      this.pollTranscriptionJob(jobName, lessonId, transcriptionUrl).catch(
        (err) => console.error("Background polling error:", err)
      );

      return {
        status: "PROCESSING",
        transcriptionUrl,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateTranscriptionStatus(lessonId, transcriptionUrl) {
    try {
      const updateData = {
        transcription: transcriptionUrl,
        updated_at: new Date(),
      };

      await knex("lesson_video").where({ id: lessonId }).update(updateData);

      console.log(`Updated transcription status for ${lessonId}`);
    } catch (dbError) {
      console.error("Database Update Error:", dbError);
      throw dbError;
    }
  }

  async pollTranscriptionJob(jobName, lessonId, transcriptionUrl) {
    const maxAttempts = 60;
    const delay = 10000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const data = await this.transcribeService
          .getTranscriptionJob({
            TranscriptionJobName: jobName,
          })
          .promise();

        const status = data.TranscriptionJob.TranscriptionJobStatus;
        console.log(`Transcription status (attempt ${attempt + 1}):`, status);

        if (status === "COMPLETED") {
          // Update transcription status in the database
          await this.updateTranscriptionStatus(lessonId, transcriptionUrl);

          // Set ACL to public-read for the transcription output file
          const transcriptionKey = `transcriptions/${jobName}.json`;
          const outputBucket = process.env.AWS_S3_BUCKET_NAME;

          const aclParams = {
            Bucket: outputBucket,
            Key: transcriptionKey,
            ACL: "public-read", // Set the ACL to public-read
          };

          try {
            await this.s3.putObjectAcl(aclParams).promise();
            console.log(`Set public-read ACL for ${transcriptionKey}`);
          } catch (aclError) {
            console.error("Error setting public-read ACL:", aclError);
            throw aclError;
          }

          console.log("Transcription completed and ACL set");
          return;
        } else if (status === "FAILED") {
          const reason = data.TranscriptionJob.FailureReason || "Unknown error";
          throw new Error(`Transcription failed: ${reason}`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error("Polling Error:", error);

        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
  }
}

module.exports = new TranscriptionService();
