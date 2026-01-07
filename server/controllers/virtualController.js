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

exports.saveVirtualSessionData = async (req, res) => {
  try {
    const { userId, sessionId, status } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required." });
    }

    // Fetch current userIds for this session
    const session = await knex("virtual_section")
      .select("joined_users")
      .where({ id: sessionId })
      .first();

    let existingUserIds = [];

    if (session?.joined_users) {
      try {
        // Always parse the JSON string
        existingUserIds = JSON.parse(session.joined_users);
      } catch (err) {
        console.warn("Invalid JSON in joined_users, resetting to []");
        existingUserIds = [];
      }
    }

    // Add user only if not already present
    // if (!existingUserIds.includes(userId)) {
    //   existingUserIds.push(userId);
    // }

    let updatedUserIds = [...existingUserIds];

    if (status === true) {
      if (!updatedUserIds.includes(userId)) {
        updatedUserIds.push(userId);
      }
    } else if (status === false) {
      updatedUserIds = updatedUserIds.filter((id) => id !== userId);
    }

    // Update DB with new array
    await knex("virtual_section")
      .where({ id: sessionId })
      .update({ joined_users: JSON.stringify(updatedUserIds) });

    res.status(200).json({
      success: true,
      message: "User added successfully.",
      data: updatedUserIds,
    });
  } catch (error) {
    console.error("Error in updating user:", error);
    res.status(500).json({
      success: false,
      message: "Database update failed.",
      error: error.message,
    });
  }
};

exports.scheduleSocketSession = async (req, res) => {
  try {
    const { sessionId, patientId, title, src, scheduleTime } = req.body;

    if (!sessionId || !scheduleTime) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    await knex("scheduled_sockets").insert({
      session_id: sessionId,
      // patient_id: patientId,
      title,
      src,
      schedule_time: scheduleTime,
      status: "pending",
    });
    res.status(200).json({
      success: true,
      message: "Socket scheduled",
    });
    //  return res.json({ success: true, message: "Socket scheduled" });
  } catch (err) {
    console.error("Error scheduling socket:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllVirtualSections = async (req, res) => {
  try {
    const data = await knex("virtual_section as vs")
      .leftJoin("patient_records as pr", "vs.selected_patient", "pr.id")
      .select(
        "vs.id",
        "vs.session_name",
        "vs.patient_type",
        "vs.room_type",
        "vs.session_time",
        "vs.status",
        "vs.selected_patient",
        "pr.name as patient_name"
      )
      .orderBy("vs.id", "desc");

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

exports.getVrSessionById = async (req, res) => {
  const { patientId } = req.params;
  try {
    const session = await knex("virtual_section")
      .where({ selected_patient: patientId })
      .where("status", "active")
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

    let joinedUsers = [];
    try {
      joinedUsers = JSON.parse(session.joined_users || "[]");
    } catch (e) {
      console.error("Invalid joined_users format:", e);
    }

    // Get count
    const joinedUsersCount = Array.isArray(joinedUsers)
      ? joinedUsers.length
      : 0;

    console.log("Joined users count:", joinedUsersCount);

    res.status(200).json({
      success: true,
      data: {
        session,
        total_sessions: totalSessions?.total || 0,
        joinedUsersCount,
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

exports.getScheduledSockets = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const scheduled_sockets = await knex("scheduled_sockets")
      .where("status", "pending")
      .where("session_id", sessionId);

    res.status(200).json({
      success: true,
      data: scheduled_sockets,
    });
  } catch (error) {
    console.error("Error fetching scheduled_sockets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled_sockets.",
      error: error.message,
    });
  }
};

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

exports.getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "id parameter is required." });
    }

    const data = await knex("virtual_section").where({ id });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user virtual sections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user virtual sections.",
      error: error.message,
    });
  }
};
