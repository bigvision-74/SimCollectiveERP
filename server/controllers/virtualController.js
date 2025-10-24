const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
require("dotenv").config();

// Add a new virtual section record

exports.addVirtualSection = async (req, res) => {
  try {
    const {
      user_id,
      session_name,
      patient_type,
      room_type,
      selected_patient,
      session_time,
      organisation_id,
    } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required." });
    }

    const [id] = await knex("virtual_section").insert({
      user_id,
      session_name,
      patient_type,
      room_type,
      selected_patient,
      organisation_id,
      status: "active",
      session_time: session_time,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });

    res.status(201).json({
      success: true,
      message: "Virtual section added successfully.",
      data: id,
    });
  } catch (error) {
    console.error("Error inserting virtual_section:", error);
    res.status(500).json({
      success: false,
      message: "Database insert failed.",
      error: error.message,
    });
  }
};

//Get all virtual sections
exports.getAllVirtualSections = async (req, res) => {
  try {
    const data = await knex("virtual_section")
      .select(
        "id",
        "session_name",
        "patient_type",
        "room_type",
        "selected_patient"
      )
      .orWhere("status", "active")
      .orderBy("id", "desc");

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching virtual_section:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch virtual sections.",
      error: error.message,
    });
  }
};

//Get virtual session detail according to Id
exports.getVrSessionById = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await knex("virtual_section")
      .select(
        "id",
        "session_name",
        "patient_type",
        "room_type",
        "selected_patient"
      )
      .where("id", sessionId)
      .first();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    const totalSessions = await knex("virtual_section")
      .where("selected_patient", session.selected_patient)
      .count("id as total")
      .first();

    res.status(200).json({
      success: true,
      data: {
        session,
        total_sessions: totalSessions?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching virtual_section:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch virtual sections.",
      error: error.message,
    });
  }
};

// delete virtual function
exports.deleteVirtualSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing session ID" });
    }

    // Delete from DB
    const deleted = await knex("virtual_section")
      .where("id", id)
      .update("status", "ended");

    if (deleted === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting session",
      error: error.message,
    });
  }
};

/**
 * Get virtual sections by user_id (optional)
 * GET /virtual-section/:user_id
 */
// exports.getVirtualSectionsByUser = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         if (!user_id) {
//             return res
//                 .status(400)
//                 .json({ success: false, message: "user_id parameter is required." });
//         }

//         const data = await knex("virtual_section")
//             .where({ user_id })
//             .orderBy("id", "desc");

//         res.status(200).json({ success: true, data });
//     } catch (error) {
//         console.error("Error fetching user virtual sections:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch user virtual sections.",
//             error: error.message,
//         });
//     }
// };
