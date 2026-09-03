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
      coloredLogo,
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
      coloredLogo,
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

exports.getPlans = async (req, res) => {
  try {
    const plans = await knex("plans").select(
      "plan_type", "wards", "ward_users", "wards_patients", "faculty_logins",
      "concurrent_simulations", "storage", "ai_patients", "ai_observations",
      "manual_patients", "manual_observations", "total_users"
    );
    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch plans." });
  }
};

exports.updatePlan = async (req, res) => {
  const { plan_type, column, value } = req.body;

  const allowedColumns = [
    "wards", "ward_users", "wards_patients", "faculty_logins",
    "concurrent_simulations", "storage", "ai_patients", "ai_observations",
    "manual_patients", "manual_observations", "total_users",
  ];

  if (!plan_type || !column || value === undefined || value === "") {
    return res.status(400).json({ success: false, message: "plan_type, column and value are required." });
  }

  if (!allowedColumns.includes(column)) {
    return res.status(400).json({ success: false, message: "Invalid column." });
  }

  try {
    const plan = await knex("plans").where({ plan_type }).first();
    if (!plan) {
      return res.status(404).json({ success: false, message: `Plan '${plan_type}' not found.` });
    }

    await knex("plans").where({ plan_type }).update({ [column]: value });

    return res.status(200).json({ success: true, message: "Plan updated successfully." });
  } catch (error) {
    console.error("Error updating plan:", error);
    return res.status(500).json({ success: false, message: "Failed to update plan." });
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
