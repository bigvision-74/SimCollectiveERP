// const knex = require("../db/knex");
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { uploadFile } = require("../services/S3_Services"); // Or use local upload handler

// save setting data function
exports.saveSettings = async (req, res) => {
  try {
    const {
      title,
      description,
      keywords,
      favicon,
      logo,
      stripeMode,
      trialRecords,
      patients,
      fileSize,
      storage,
    } = req.body;

    // if (!title || !description || !keywords) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Missing required fields: title, description, keywords",
    //   });
    // }

    const newSettings = {
      title,
      description,
      keywords,
      favicon,
      logo,
      keyType: stripeMode,
      updated_at: new Date(),
      trialRecords,
      patients,
      fileSize,
      storage,
    };

    const exists = await knex("settings").where("id", 1).first();

    if (exists) {
      await knex("settings").where("id", 1).update(newSettings);
    } else {
      await knex("settings").insert({ id: 1, ...newSettings });
    }

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save settings",
    });
  }
};

// save setting display when pae open
exports.getSettings = async (req, res) => {
  try {
    const settings = await knex("settings").where("id", 1).first();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};
