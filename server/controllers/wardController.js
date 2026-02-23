const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
require("dotenv").config();
const { getIO } = require("../websocket");
const { secondaryApp } = require("../firebase");

exports.allOrgPatients = async (req, res) => {
  const { orgId } = req.params;

  try {
    console.log(orgId, "orgaiddddddddddddd");
    const patients = await knex("patient_records")
      .whereRaw("LOWER(status) = ?", ["completed"])
      .where("organisation_id", orgId)
      .andWhere(function () {
        this.where("type", "private");
      })
      .andWhere(function () {
        this.whereNull("deleted_at").orWhere("deleted_at", "");
      });
    console.log(patients, "patientspatientspatients");
    return res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching org patients:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.saveWard = async (req, res) => {
  try {
    const {
      wardName,
      facultyId,
      observerId,
      patients,
      users,
      orgId,
      adminId,
      performerId,
    } = req.body;

    if (!wardName || !facultyId || !orgId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Ward Name, Faculty, or Org ID.",
      });
    }

    const currentTime = new Date();

    const wardData = {
      name: wardName,
      faculty: facultyId,
      observer: observerId || null,
      users: JSON.stringify(users || []),
      patients: JSON.stringify(patients || []),
      admin: adminId,
      orgId: orgId,
      created_at: currentTime,
      updated_at: currentTime,
    };

    const [id] = await knex("wards").insert(wardData).returning("id");
    const insertedId = typeof id === "object" && id !== null ? id.id : id;

    // --- ACTIVITY LOG START ---
    try {
      await knex("activity_logs").insert({
        user_id: performerId || 1,
        action_type: "CREATE",
        entity_name: "Ward",
        entity_id: insertedId,
        details: JSON.stringify({
          data: {
            ward_name: wardName,
            faculty_id: facultyId,
            observer_id: observerId || "N/A",
            total_patients: Array.isArray(patients) ? patients.length : 0,
            total_users: Array.isArray(users) ? users.length : 0,
            organisation_id: orgId,
          },
        }),
        created_at: new Date(),
      });
    } catch (logError) {
      console.error("Activity log failed for saveWard:", logError);
    }
    // --- ACTIVITY LOG END ---

    return res.status(201).json({
      success: true,
      message: "Ward created successfully",
      data: {
        id: insertedId,
        ...wardData,
      },
    });
  } catch (error) {
    console.error("Error saving ward:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.allWardsByOrg = async (req, res) => {
  try {
    const orgId = req.params.orgId;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const wards = await knex("wards")
      .where("orgId", orgId)
      .orderBy("created_at", "desc");

    if (!wards.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No wards found",
      });
    }

    const allUserIds = new Set();
    const allPatientIds = new Set();

    wards.forEach((ward) => {
      if (ward.faculty) allUserIds.add(ward.faculty);
      if (ward.observer) allUserIds.add(ward.observer);
      if (ward.admin) allUserIds.add(ward.admin);

      try {
        const usersArray = JSON.parse(ward.users || "[]");
        if (Array.isArray(usersArray)) {
          usersArray.forEach((id) => allUserIds.add(String(id)));
        }
      } catch (e) {
        console.error(`Error parsing users JSON for ward ${ward.id}`, e);
      }

      try {
        const patientsArray = JSON.parse(ward.patients || "[]");
        if (Array.isArray(patientsArray)) {
          patientsArray.forEach((id) => allPatientIds.add(String(id)));
        }
      } catch (e) {
        console.error(`Error parsing patients JSON for ward ${ward.id}`, e);
      }
    });

    const [usersData, patientsData] = await Promise.all([
      knex("users")
        .whereIn("id", Array.from(allUserIds))
        .select(
          "id",
          "fname",
          "lname",
          "uemail",
          "role",
          "user_thumbnail",
          "user_unique_id",
        ),
      knex("patient_records")
        .whereIn("id", Array.from(allPatientIds))
        .select(
          "id",
          "name",
          "ageGroup",
          "gender",
          "patient_thumbnail",
          "medical_history",
        ),
    ]);

    const userMap = usersData.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const patientMap = patientsData.reduce((acc, patient) => {
      acc[patient.id] = patient;
      return acc;
    }, {});

    const populatedWards = wards.map((ward) => {
      let assignedStudentIds = [];
      let assignedPatientIds = [];
      try {
        assignedStudentIds = JSON.parse(ward.users || "[]");
      } catch (e) {}
      try {
        assignedPatientIds = JSON.parse(ward.patients || "[]");
      } catch (e) {}

      return {
        ...ward,
        faculty: userMap[ward.faculty] || null,
        observer: userMap[ward.observer] || null,
        admin: userMap[ward.admin] || null,

        users: assignedStudentIds
          .map((id) => userMap[id])
          .filter((u) => u !== undefined),

        patients: assignedPatientIds
          .map((id) => patientMap[id])
          .filter((p) => p !== undefined),

        patientCount: assignedPatientIds.length,
        studentCount: assignedStudentIds.length,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Wards fetched successfully",
      data: populatedWards,
    });
  } catch (error) {
    console.error("Error fetching wards:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteWards = async (req, res) => {
  const { id } = req.params;
  const { performerId } = req.body; // performerId should be passed from frontend body

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ward ID is required",
      });
    }

    // 1. Fetch the ward details before deleting for the activity log
    const wardToDelete = await knex("wards").where({ id: id }).first();

    if (!wardToDelete) {
      return res.status(404).json({
        success: false,
        message: "Ward not found or already deleted",
      });
    }

    // 2. Perform the hard deletion
    const rowsDeleted = await knex("wards").where("id", id).del();

    if (rowsDeleted > 0) {
      // --- ACTIVITY LOG START ---
      try {
        await knex("activity_logs").insert({
          user_id: performerId || wardToDelete.admin || 1,
          action_type: "DELETE",
          entity_name: "Ward",
          entity_id: id,
          details: JSON.stringify({
            data: {
              ward_name: wardToDelete.name,
              faculty_id: wardToDelete.faculty,
              organisation_id: wardToDelete.orgId,
              status: "Permanently Deleted",
            },
          }),
          created_at: new Date(),
        });
      } catch (logError) {
        console.error("Activity log failed for deleteWards:", logError);
      }
      // --- ACTIVITY LOG END ---

      return res.status(200).json({
        success: true,
        message: "Ward deleted successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Ward not found or already deleted",
      });
    }
  } catch (error) {
    console.error("Error deleting ward:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getWardById = async (req, res) => {
  try {
    const { id } = req.params;

    const ward = await knex("wards").where("id", id).first();

    if (!ward) {
      return res
        .status(404)
        .json({ success: false, message: "Ward not found" });
    }

    let userIds = [];
    let patientIds = [];

    try {
      userIds = JSON.parse(ward.users || "[]");
      patientIds = JSON.parse(ward.patients || "[]");
    } catch (e) {
      console.error("JSON Parse error", e);
    }

    const singleUserFields = [ward.faculty, ward.observer, ward.admin];

    const allUserIdsToFetch = [
      ...new Set([...userIds, ...singleUserFields]),
    ].filter((uid) => uid);

    const [usersDetails, patientsDetails] = await Promise.all([
      knex("users")
        .whereIn("id", allUserIdsToFetch)
        .select(
          "id",
          "fname",
          "lname",
          "username",
          "uemail",
          "role",
          "user_thumbnail",
          "organisation_id",
        ),

      knex("patient_records").whereIn("id", patientIds).select("*"),
    ]);

    const userMap = usersDetails.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const patientMap = patientsDetails.reduce((acc, patient) => {
      acc[patient.id] = patient;
      return acc;
    }, {});

    const getUser = (id) => userMap[id] || id;

    const data = {
      ...ward,
      users: userIds.map((id) => getUser(id)),
      patients: patientIds.map((id) => patientMap[id] || id),

      faculty: getUser(ward.faculty),
      observer: getUser(ward.observer),
      admin: getUser(ward.admin),
    };

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching ward:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateWard = async (req, res) => {
  try {
    const { id } = req.params;
    const { wardName, facultyId, observerId, patients, users, performerId } =
      req.body;

    if (!wardName || !facultyId) {
      return res.status(400).json({
        success: false,
        message: "Ward Name and Faculty are required.",
      });
    }

    // 1. Fetch old data for comparison before updating
    const oldWard = await knex("wards").where({ id }).first();
    if (!oldWard) {
      return res
        .status(404)
        .json({ success: false, message: "Ward not found" });
    }

    const numericUsers = (users || []).map((id) => Number(id));
    const numericPatients = (patients || []).map((id) => Number(id));

    const updateData = {
      name: wardName,
      faculty: facultyId,
      observer: observerId || null,
      users: JSON.stringify(numericUsers),
      patients: JSON.stringify(numericPatients),
      updated_at: new Date(),
    };

    // Calculate changes for Activity Log
    const changes = {};

    // Compare basic fields
    if (oldWard.name !== updateData.name) {
      changes.ward_name = { old: oldWard.name, new: updateData.name };
    }
    if (oldWard.faculty !== updateData.faculty) {
      changes.faculty_id = { old: oldWard.faculty, new: updateData.faculty };
    }
    if (oldWard.observer !== updateData.observer) {
      changes.observer_id = {
        old: oldWard.observer || "N/A",
        new: updateData.observer || "N/A",
      };
    }

    // Compare counts for users and patients
    const oldUsers = JSON.parse(oldWard.users || "[]");
    const oldPatients = JSON.parse(oldWard.patients || "[]");

    if (oldUsers.length !== numericUsers.length) {
      changes.assigned_users_count = {
        old: oldUsers.length,
        new: numericUsers.length,
      };
    }
    if (oldPatients.length !== numericPatients.length) {
      changes.assigned_patients_count = {
        old: oldPatients.length,
        new: numericPatients.length,
      };
    }

    // 2. Execute update
    const rowsAffected = await knex("wards")
      .where({ id: id })
      .update(updateData);

    if (rowsAffected > 0) {
      // --- ACTIVITY LOG START ---
      try {
        if (Object.keys(changes).length > 0) {
          await knex("activity_logs").insert({
            user_id: performerId || oldWard.admin || 1,
            action_type: "UPDATE",
            entity_name: "Ward",
            entity_id: id,
            details: JSON.stringify({ changes }),
            created_at: new Date(),
          });
        }
      } catch (logError) {
        console.error("Activity log failed for updateWard:", logError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Ward updated successfully",
    });
  } catch (error) {
    console.error("Error updating ward:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.startWardSession = async (req, res) => {
  const { wardId, duration, assignments, currentUser } = req.body;
  const utcTime = new Date().toISOString();

  try {
    const wardIo = global.wardIo;

    const [sessionId] = await knex("wardsession").insert({
      ward_id: wardId,
      started_by: currentUser,
      status: "ACTIVE",
      assignments: JSON.stringify(assignments),
      start_time: utcTime,
      duration: duration || 60,
    });

    const currentUserData = await knex("users")
      .where("id", currentUser)
      .first();

    const adminData = await knex("users")
      .where("role", "Admin")
      .andWhere("organisation_id", currentUserData.organisation_id)
      .first();

    const targetUserIds = new Set();

    if (adminData?.id) {
      targetUserIds.add(adminData.id);
    }

    for (const [key, data] of Object.entries(assignments)) {
      if (Array.isArray(data)) {
        data.forEach((userId) => {
          if (userId && userId !== "unassigned") {
            targetUserIds.add(userId);
          }
        });
      } else if (typeof data === "object" && data !== null) {
        if (
          data.userId &&
          data.userId !== "unassigned" &&
          Array.isArray(data.patientIds) &&
          data.patientIds.length > 0
        ) {
          targetUserIds.add(data.userId);
        }
      }
    }

    const userIdsArray = Array.from(targetUserIds);

    const targetUsers = await knex("users")
      .select("id", "username", "fcm_token")
      .whereIn("id", userIdsArray);

    const userMap = {};
    targetUsers.forEach((user) => {
      userMap[user.id] = user.username;
    });

    for (const userId of targetUserIds) {
      const username = userMap[userId];
      if (!username) continue;

      let roomIndex = "";

      for (const [key, data] of Object.entries(assignments)) {
        let found = false;

        if (Array.isArray(data)) {
          if (data.includes(userId)) {
            roomIndex = "all";
            found = true;
          }
        } else if (typeof data === "object" && data !== null) {
          if (data.userId === userId) {
            roomIndex = key.replace("zone", "");
            found = true;
          }
        }

        if (found) break;
      }

      wardIo.to(username).emit("start_ward_session", {
        sessionId,
        wardId,
        assignedRoom: roomIndex,
        startedBy: currentUser,
        startedByRole: currentUserData?.role || "admin",
      });
    }

    const tokens = targetUsers
      .map((user) => user.fcm_token)
      .filter((token) => !!token);

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "Ward Session Started",
          body: "A new ward session has started.",
        },
        tokens,
        data: {
          sessionId: String(sessionId),
          wardId: String(wardId),
        },
      };

      const response = await secondaryApp
        .messaging()
        .sendEachForMulticast(message);

      response.responses.forEach(async (resp, index) => {
        if (!resp.success) {
          const failedToken = tokens[index];

          if (
            resp.error?.errorInfo?.code ===
              "messaging/registration-token-not-registered" ||
            resp.error?.errorInfo?.code ===
              "messaging/invalid-registration-token"
          ) {
            await knex("users")
              .where({ fcm_token: failedToken })
              .update({ fcm_token: null });

            console.log(`🧹 Removed invalid token: ${failedToken}`);
          }
        }
      });

      console.log(
        `✅ Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`,
      );
    }

    res.status(200).json({
      success: true,
      wardId,
      sessionId,
    });
  } catch (error) {
    console.error("Error starting ward session:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getWardSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Get ward session
    const wardSession = await knex("wardsession")
      .where("id", sessionId)
      .first();

    if (!wardSession) {
      return res.status(404).json({ error: "Ward session not found" });
    }

    // Parse assignments JSON
    const assignments = JSON.parse(wardSession.assignments);

    // Extract all user IDs from assignments
    const userIds = new Set();

    // Add faculty user IDs
    if (assignments.faculty && Array.isArray(assignments.faculty)) {
      assignments.faculty.forEach((id) => userIds.add(id));
    }

    // Add observer user IDs
    if (assignments.Observer && Array.isArray(assignments.Observer)) {
      assignments.Observer.forEach((id) => userIds.add(id));
    }

    // Add zone user IDs and collect patient IDs
    const patientIds = new Set();

    // Iterate through zones
    for (const zoneKey in assignments) {
      if (zoneKey.startsWith("zone")) {
        const zone = assignments[zoneKey];
        if (zone && zone.userId) {
          userIds.add(zone.userId);
        }
        if (zone && zone.patientIds && Array.isArray(zone.patientIds)) {
          zone.patientIds.forEach((id) => patientIds.add(id));
        }
      }
    }

    // Add started_by user ID
    if (wardSession.started_by) {
      userIds.add(wardSession.started_by);
    }

    // Convert sets to arrays
    const userIdArray = Array.from(userIds);
    const patientIdArray = Array.from(patientIds);

    // Fetch user details
    const users = await knex("users")
      .select(
        "id",
        "fname",
        "lname",
        "username",
        "uemail",
        "role",
        "user_thumbnail",
      )
      .whereIn("id", userIdArray);

    // Create user map for easy access
    const userMap = {};
    users.forEach((user) => {
      userMap[user.id] = user;
    });

    // Fetch patient details
    const patients = await knex("patient_records")
      .select(
        "id",
        "name",
        "email",
        "phone",
        "date_of_birth",
        "gender",
        "category",
        "height",
        "weight",
        "scenario_location",
        "room_type",
        "allergies",
        "medical_history",
        "patient_thumbnail",
        "status",
        "type",
      )
      .whereIn("id", patientIdArray);

    // Create patient map for easy access
    const patientMap = {};
    patients.forEach((patient) => {
      patientMap[patient.id] = patient;
    });

    // Get ward details
    const ward = await knex("wards")
      .select("id", "name", "orgId")
      .where("id", wardSession.ward_id)
      .first();

    // Structure the response with enriched data
    const response = {
      session: {
        id: wardSession.id,
        ward_id: wardSession.ward_id,
        started_by: wardSession.started_by,
        status: wardSession.status,
        start_time: wardSession.start_time,
        duration: wardSession.duration,
        created_at: wardSession.created_at,
        updated_at: wardSession.updated_at,
      },
      assignments: {
        faculty: assignments.faculty
          ? assignments.faculty.map(
              (id) => userMap[id] || { id, error: "User not found" },
            )
          : [],
        observer: assignments.Observer
          ? assignments.Observer.map(
              (id) => userMap[id] || { id, error: "User not found" },
            )
          : [],
        zones: {},
      },
      started_by_user: userMap[wardSession.started_by] || {
        id: wardSession.started_by,
        error: "User not found",
      },
      ward: ward || { id: wardSession.ward_id, error: "Ward not found" },
    };

    // Add zone details with enriched data
    for (const zoneKey in assignments) {
      if (zoneKey.startsWith("zone")) {
        const zone = assignments[zoneKey];
        response.assignments.zones[zoneKey] = {
          user: userMap[zone.userId] || {
            id: zone.userId,
            error: "User not found",
          },
          patients: zone.patientIds
            ? zone.patientIds.map(
                (id) => patientMap[id] || { id, error: "Patient not found" },
              )
            : [],
        };
      }
    }

    // Send response
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching ward session:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.getAvailableUsers = async (req, res) => {
  try {
    const { orgId } = req.params;

    const activeSessions = await knex("wardsession")
      .join("users as creator", "wardsession.started_by", "creator.id")
      .where("creator.organisation_id", orgId)
      .whereNot("wardsession.status", "COMPLETED")
      .select("wardsession.assignments");

    let busyUserIds = [];

    activeSessions.forEach((session) => {
      if (session.assignments) {
        try {
          const data =
            typeof session.assignments === "string"
              ? JSON.parse(session.assignments)
              : session.assignments;

          if (data.faculty && Array.isArray(data.faculty)) {
            busyUserIds.push(...data.faculty);
          }

          if (data.Observer && Array.isArray(data.Observer)) {
            busyUserIds.push(...data.Observer);
          }

          Object.keys(data).forEach((key) => {
            if (key.startsWith("zone") && data[key].userId) {
              busyUserIds.push(data[key].userId);
            }
          });
        } catch (err) {
          console.error("Error parsing session assignments JSON:", err);
        }
      }
    });

    busyUserIds = [...new Set(busyUserIds)].map((id) => parseInt(id));
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const availableUsers = await knex("users")
      .where("organisation_id", orgId)
      .whereNotIn("id", busyUserIds)
      .where("user_deleted", 0)
      .where("org_delete", 0)
      .where("lastLogin", ">", sixHoursAgo)
      .select("id", "fname", "lname", "username", "role", "user_thumbnail");

    return res.status(200).json({
      success: true,
      count: availableUsers.length,
      data: availableUsers,
    });
  } catch (error) {
    console.error("getAvailableUsers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.getActiveWardSession = async (req, res) => {
  const { orgId } = req.params;

  try {
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const activeSession = await knex("wardsession")
      .join("wards", "wardsession.ward_id", "=", "wards.id")
      .join("users", "users.id", "=", "wardsession.started_by")
      .select(
        "wardsession.id as sessionId",
        "wardsession.ward_id as wardId",
        "wardsession.start_time",
        "wardsession.duration",
        "wardsession.status",
        "wards.name as wardName",
      )
      .where("wardsession.status", "ACTIVE")
      .andWhere("users.organisation_id", orgId)
      .first();

    if (activeSession) {
      return res.status(200).json({
        success: true,
        data: activeSession,
      });
    }

    return res.status(200).json({
      success: false,
      message: "No active session found",
    });
  } catch (error) {
    console.error("Error fetching active ward session:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getAllWardSession = async (req, res) => {
  try {
    const wardsSessions = await knex("wardsession")
      .leftJoin("wards", "wardsession.ward_id", "wards.id")
      .leftJoin("users", "wardsession.started_by", "users.id")
      .select(
        "wardsession.*",
        "wards.name as ward_name",
        "users.fname as started_by_fname",
        "users.lname as started_by_lname",
        "wards.id as ward_id",
        "users.id as user_id",
      )
      .orderBy("wardsession.created_at", "desc");

    const userIdsToFetch = new Set();
    const patientIdsToFetch = new Set();

    wardsSessions.forEach((session) => {
      if (session.endedBy && session.endedBy !== "auto") {
        userIdsToFetch.add(session.endedBy);
      }

      let assignments = session.assignments;
      if (typeof assignments === "string") {
        try {
          assignments = JSON.parse(assignments);
        } catch (e) {
          assignments = {};
        }
      }

      if (Array.isArray(assignments.faculty))
        assignments.faculty.forEach((id) => userIdsToFetch.add(id));
      if (Array.isArray(assignments.Observer))
        assignments.Observer.forEach((id) => userIdsToFetch.add(id));

      Object.keys(assignments).forEach((key) => {
        if (key.startsWith("zone")) {
          if (assignments[key]?.userId)
            userIdsToFetch.add(assignments[key].userId);
          if (Array.isArray(assignments[key]?.patientIds)) {
            assignments[key].patientIds.forEach((pid) =>
              patientIdsToFetch.add(pid),
            );
          }
        }
      });
    });

    const users = await knex("users")
      .whereIn("id", Array.from(userIdsToFetch))
      .select("id", "fname", "lname");

    const patients = await knex("patient_records")
      .whereIn("id", Array.from(patientIdsToFetch))
      .select(
        "id",
        "name",
        "gender",
        "ageGroup",
        "patient_thumbnail",
        "room_type",
        "scenario_location",
      );

    const userMap = users.reduce(
      (acc, u) => ({ ...acc, [u.id.toString()]: u }),
      {},
    );
    const patientMap = patients.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    const enrichedSessions = wardsSessions.map((session) => {
      if (session.endedBy && session.endedBy !== "auto") {
        const ender = userMap[session.endedBy.toString()];
        if (ender) {
          session.ended_by_fname = ender.fname;
          session.ended_by_lname = ender.lname;
        }
      }

      if (session.ended_at && session.start_time) {
        const start = new Date(session.start_time);
        const end = new Date(session.ended_at);
        const diffMs = end - start;
        const totalSeconds = Math.floor(diffMs / 1000);

        if (totalSeconds < 60) {
          session.duration = `${Math.max(0, totalSeconds)} sec`;
        } else {
          const mins = Math.floor(totalSeconds / 60);
          session.duration = `${mins} min`;
        }
      } else {
        session.duration = null;
      }

      let assignments = session.assignments;
      if (typeof assignments === "string") {
        try {
          assignments = JSON.parse(assignments);
        } catch (e) {
          assignments = {};
        }
      }

      const getUser = (id) =>
        userMap[id.toString()] || { id: id, fname: "Unknown", lname: "" };
      const getPatient = (id) =>
        patientMap[id] || { id: id, name: "Unknown Patient" };

      if (Array.isArray(assignments.faculty))
        assignments.faculty = assignments.faculty.map(getUser);
      if (Array.isArray(assignments.Observer))
        assignments.Observer = assignments.Observer.map(getUser);

      Object.keys(assignments).forEach((key) => {
        if (key.startsWith("zone")) {
          if (assignments[key]?.userId) {
            assignments[key].userDetails = getUser(assignments[key].userId);
          }
          if (Array.isArray(assignments[key]?.patientIds)) {
            assignments[key].patientDetails =
              assignments[key].patientIds.map(getPatient);
          }
        }
      });

      return { ...session, assignments };
    });

    return res.status(200).json({ success: true, data: enrichedSessions });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

exports.deleteSessions = async (req, res) => {
  try {
    const { sessionIds, adminName } = req.body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No session IDs provided for deletion.",
      });
    }

    const sessionsToDelete = await knex("wardsession").whereIn(
      "id",
      sessionIds,
    );

    if (sessionsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching sessions found to delete.",
      });
    }

    await knex("wardsession").whereIn("id", sessionIds).del();

    try {
      const logEntries = sessionsToDelete.map((session) => ({
        user_id: req.user?.id || 0,
        action_type: "DELETE",
        entity_name: "Ward Session",
        entity_id: session.id,
        details: JSON.stringify({
          deleted_by: adminName || "Admin",
          ward_name: session.ward_name,
          original_created_at: session.created_at,
        }),
        created_at: new Date(),
      }));

      if (logEntries.length > 0) {
        await knex("activity_logs").insert(logEntries);
      }
    } catch (logError) {
      console.error("Activity log failed for deleteSessions:", logError);
    }

    return res.status(200).json({
      success: true,
      message: `${sessionsToDelete.length} session(s) permanently deleted.`,
    });
  } catch (error) {
    console.error("Error deleting sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
