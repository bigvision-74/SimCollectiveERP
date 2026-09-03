const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { getIO } = require("../websocket");
const { secondaryApp } = require("../firebase");

exports.createSession = async (req, res) => {
  const {
    patient,
    createdBy,
    name,
    duration,
    assignments,
    patientType,
    roomType,
    isVirtual,
  } = req.body;

  try {
    const io = getIO();
    const user = await knex("users").where({ uemail: createdBy }).first();
    const patient_records = await knex("patient_records")
      .where({ id: patient })
      .first();

    let participantIds = [user.id];

    if (assignments) {
      try {
        const data =
          typeof assignments === "string"
            ? JSON.parse(assignments)
            : assignments;
        if (data.faculty && Array.isArray(data.faculty))
          participantIds.push(...data.faculty);
        if (data.Observer && Array.isArray(data.Observer))
          participantIds.push(...data.Observer);
        Object.keys(data).forEach((key) => {
          if (key.startsWith("zone") && data[key].userId)
            participantIds.push(data[key].userId);
        });
      } catch (err) {
        console.error("Error parsing assignments:", err);
      }
    }

    const adminUser = await knex("users")
      .where({ organisation_id: user.organisation_id, role: "Admin" })
      .first();
    if (adminUser) participantIds.push(adminUser.id);

    participantIds = [...new Set(participantIds)];
    const selectedUsers = await knex("users")
      .whereIn("id", participantIds)
      .select("id", "fname", "lname", "uemail", "role");

    const initialParticipants = selectedUsers.map((u) => ({
      id: u.id,
      name: `${u.fname} ${u.lname}`,
      uemail: u.uemail,
      role: u.role,
      inRoom: false,
    }));

    const [sessionId] = await knex("session").insert({
      patient,
      name,
      duration,
      state: "active",
      createdBy: user.id,
      startTime: new Date(),
      participants: JSON.stringify(initialParticipants),
    });

<<<<<<< HEAD
    // Increment sessions_used in organisations table
    try {
      const org = await knex("organisations").where("id", user.organisation_id).first();
      if (!org) {
        console.warn("Organization not found for orgId:", user.organisation_id);
      } else {
        const result = await knex("organisations")
          .where("id", user.organisation_id)
          .update({
            sessions_used: knex.raw("COALESCE(sessions_used, 0) + 1")
          });
      }
    } catch (incrementError) {
      console.error("Error incrementing sessions_used for orgId:", user.organisation_id, "Error:", incrementError.message);
    }

=======
>>>>>>> refs/remotes/origin/main
    let virtualSessionId = 0;
    if (isVirtual == "true" && roomType && patientType) {
      virtualSessionId = await knex("virtual_section").insert({
        user_id: user.id,
        session_name: name,
        patient_type: patientType,
        room_type: roomType,
        selected_patient: patient,
        organisation_id: user.organisation_id,
        status: "active",
        sessionId: sessionId,
        session_time: duration,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }

    const startTime = new Date();

    io.to(`org_${user.organisation_id}`).emit("session:started", {
      sessionId: sessionId,
      patient_name: patient_records.name,
      patientId: patient,
      startedBy: user.id,
      sessionName: name,
      duration,
      startTime: startTime.toISOString(),
      participants: initialParticipants,
    });

    const sessionDetails = await knex("session")
      .where({ id: sessionId })
      .select("participants", "patient");

    const userIds = sessionDetails.flatMap((session) => {
      const participants =
        typeof session.participants === "string"
          ? JSON.parse(session.participants)
          : session.participants;

      return participants.filter((p) => p.role === "User").map((p) => p.id);
    });

    if (userIds.length > 0) {
      const users = await knex("users").whereIn("id", userIds);

      if (sessionId && sessionId != 0 && sessionDetails[0].patient == patient) {
        for (const user of users) {
          if (user && user.fcm_token) {
            const token = user.fcm_token;

            const message = {
              notification: {
                title: "Session Started",
<<<<<<< HEAD
                body: `A new session started for patient ${patient_records.name}.`,
=======
                body: `A new session started for patient ${sessionDetails.patient}.`,
>>>>>>> refs/remotes/origin/main
              },
              token,
              data: {
                sessionId: String(sessionId),
                patientId: String(sessionDetails.patient),
              },
            };

            try {
              const response = await secondaryApp.messaging().send(message);
              console.log(`✅ Notification sent to token: ${token}`);
            } catch (err) {
              console.error(
                `❌ Error sending notification to token ${token}:`,
                err,
              );

              if (
                err.errorInfo &&
                [
                  "messaging/registration-token-not-registered",
                  "messaging/invalid-registration-token",
                ].includes(err.errorInfo.code)
              ) {
                await knex("users")
                  .where({ fcm_token: token })
                  .update({ fcm_token: null });
                console.log(`🧹 Removed invalid token: ${token}`);
              }
            }
          }
        }
      }
    }

    // const sessionUsers = await knex("users")
    //   .where({ role: "User" })
    //   .orWhere({ organisation_id: user.organisation_id })
    //   .whereNotNull("fcm_token")
    //   .whereRaw("TRIM(fcm_token) <> ''");

    // const tokens = sessionUsers.map((u) => u.fcm_token).filter(Boolean);
    // if (tokens.length === 0) {
    //   console.log(
    //     "⚠️ No users with valid FCM tokens found. Skipping notification.",
    //   );
    //   return;
    // }

    // for (const token of tokens) {
    //   const message = {
    //     notification: {
    //       title: "Session Started",
    //       body: `A new session started for patient ${sessionDetails.patient}.`,
    //     },
    //     token,
    //     data: {
    //       sessionId: String(sessionId),
    //       patientId: String(sessionDetails.patient),
    //     },
    //   };

    //   try {
    //     const response = await secondaryApp.messaging().send(message);
    //     console.log(`✅ Notification sent to token: ${token}`);
    //   } catch (err) {
    //     console.error(`❌ Error sending notification to token ${token}:`, err);

    //     if (
    //       err.errorInfo &&
    //       [
    //         "messaging/registration-token-not-registered",
    //         "messaging/invalid-registration-token",
    //       ].includes(err.errorInfo.code)
    //     ) {
    //       await knex("users")
    //         .where({ fcm_token: token })
    //         .update({ fcm_token: null });
    //       console.log(`🧹 Removed invalid token: ${token}`);
    //     }
    //   }
    // }

    res.status(200).send({
      id: sessionId,
      message: "Session Created Successfully",
      virtualSessionId,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error creating session" });
  }
};

exports.addParticipant = async (req, res) => {
  const { patient, createdBy, name, duration, userId, sessionId, type } =
    req.body;
  try {
    const io = getIO();
    const sessionRoom = `session_${sessionId}`;
    console.log(userId, "userrrrrrrrrrrrrrrrrrrrrr");
    const user = await knex("users").where({ id: userId }).first();
    if (!user) return res.status(404).send({ message: "User not found" });

    // 1. Add specific user to socket
    const sockets = await io.fetchSockets();
    const targetSocket = sockets.find(
      (sock) => sock.user && sock.user.id === parseInt(userId),
    );

    let wasUserAdded = false;
    const patient_records = await knex("patient_records")
      .where({ id: patient })
      .first();
    console.log(patient_records, "patient_records");
    if (targetSocket) {
      await targetSocket.join(sessionRoom);
      wasUserAdded = true;
      targetSocket.emit("paticipantAdd", {
        sessionId,
        userId,
        sessionData: {
          sessionId,
          patientId: patient,
          type,
          patient_name: patient_records.name,
          startedBy: createdBy,
          sessionName: name,
          duration,
          startTime: new Date().toISOString(),
        },
      });
      io.to(sessionRoom).emit("userJoined", { userId });
    }

    // 2. UPDATE LIST: Filter out Ward Busy Users
    const orgid = user.organisation_id;
    const busyWardUserIds = await getBusyWardUserIds(orgid); // <--- Using the helper

    const userSessionMap = new Map();
    const currentSockets = await io.fetchSockets();
    currentSockets.forEach((sock) => {
      if (sock.user) {
        const room = Array.from(sock.rooms).find((r) =>
          r.startsWith("session_"),
        );
        if (room) userSessionMap.set(sock.user.id, room);
      }
    });

    const allOrgUsers = await knex("users")
      .where({ organisation_id: orgid })
      .whereNotIn("id", busyWardUserIds) // <--- FILTER APPLIED HERE
      .whereNotNull("lastLogin")
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      })
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      });

    const finalParticipants = allOrgUsers
      .filter((u) => {
        const usersCurrentSession = userSessionMap.get(u.id);
        return !usersCurrentSession || usersCurrentSession === sessionRoom;
      })
      .map((u) => ({
        id: u.id,
        name: `${u.fname} ${u.lname}`,
        uemail: u.uemail,
        role: u.role,
        inRoom: userSessionMap.get(u.id) === sessionRoom,
      }));

    io.to(sessionRoom).emit("participantListUpdate", {
      participants: finalParticipants,
    });

    res.status(200).send({
      id: sessionId,
      message: wasUserAdded
        ? "Participant added successfully."
        : "Participant is currently offline.",
      added: wasUserAdded,
    });
  } catch (error) {
    console.log("Error in addParticipant: ", error);
    res.status(500).send({ message: "Error adding participant" });
  }
};

exports.endSession = async (req, res) => {
  const { id, endedBy } = req.params;

  try {
    if (!id) {
      return res.status(400).send({ message: "Session ID is required." });
    }

    const io = getIO();
    const session = await knex("session").where({ id: id }).first();

    if (!session) {
      return res.status(404).send({ message: "Session not found." });
    }

    if (session.state === "ended") {
      return res.status(200).send({ message: "Session was already ended." });
    }

    const user = await knex("users").where({ id: session.createdBy }).first();

    await knex("session")
      .update({
        state: "ended",
        endTime: new Date(),
        endedBy: endedBy,
      })
      .where({ id: id });

    await knex("virtual_section")
      .where("sessionId", id)
      .update("status", "ended");

    if (user && user.organisation_id) {
      console.log(
        `[Backend] Emitting session:ended to room: org_${user.organisation_id}, sessionId: ${id}`,
      );

      const sessionRoom = `session_${id}`;
      io.to(sessionRoom).emit("session:ended");
      io.in(sessionRoom).socketsLeave(sessionRoom);
    }

    res.status(200).send({ message: "Session ended successfully" });
  } catch (error) {
    console.log("Error ending session: ", error);
    res.status(500).send({ message: "Error ending session" });
  }
};

exports.endUserSession = async (req, res) => {
  const { sessionId, userid } = req.params;
  try {
    if (!sessionId || !userid)
      return res.status(400).send({ message: "Ids required." });

    const io = getIO();
    const sessionRoom = `session_${sessionId}`;

    const socketsInRoom = await io.in(sessionRoom).fetchSockets();
    const targetSocket = socketsInRoom.find(
      (s) => s.user && String(s.user.id) === String(userid),
    );

    if (targetSocket) {
      io.to(sessionRoom).emit("removeUser", { sessionId, userid });
      targetSocket.emit("session:removed", { message: "Removed by admin." });
      targetSocket.leave(sessionRoom);
    } else {
      io.to(sessionRoom).emit("removeUser", { sessionId, userid });
    }

    const session = await knex("session").where({ id: sessionId }).first();
    if (session) {
      const currentParticipants =
        session.participants && typeof session.participants !== "string"
          ? session.participants
          : JSON.parse(session.participants || "[]");
      const updatedParticipantsForDB = currentParticipants.filter(
        (p) => String(p.id) !== String(userid),
      );
      await knex("session")
        .where({ id: sessionId })
        .update({ participants: JSON.stringify(updatedParticipantsForDB) });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    const user = await knex("users").where({ id: userid }).first();
    if (!user) return res.status(200).send({ message: "User removed." });

    const orgid = user.organisation_id;
    const busyWardUserIds = await getBusyWardUserIds(orgid);

    const userSessionMap = new Map();
    const currentSockets = await io.fetchSockets();
    currentSockets.forEach((sock) => {
      if (sock.user) {
        const room = Array.from(sock.rooms).find((r) =>
          r.startsWith("session_"),
        );
        if (room) userSessionMap.set(sock.user.id, room);
      }
    });
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const allOrgUsers = await knex("users")
      .whereNotNull("lastLogin")
      .where({ organisation_id: orgid })
      .whereNotIn("id", busyWardUserIds)
      .andWhere(
        "lastLogin",
        ">=",
        sixHoursAgo.toISOString().slice(0, 19).replace("T", " "),
      )
      .andWhere(function () {
        this.where("user_deleted", "<>", 1)
          .orWhereNull("user_deleted")
          .orWhere("user_deleted", "");
      })
      .andWhere(function () {
        this.where("org_delete", "<>", 1)
          .orWhereNull("org_delete")
          .orWhere("org_delete", "");
      });

    const finalParticipants = allOrgUsers
      .filter((u) => {
        const usersCurrentSession = userSessionMap.get(u.id);
        return !usersCurrentSession || usersCurrentSession === sessionRoom;
      })
      .map((u) => ({
        id: u.id,
        name: `${u.fname} ${u.lname}`,
        uemail: u.uemail,
        role: u.role,
        inRoom: userSessionMap.get(u.id) === sessionRoom,
      }));

    io.to(sessionRoom).emit("participantListUpdate", {
      participants: finalParticipants,
    });

    return res
      .status(200)
      .send({ message: "User removed.", participants: finalParticipants });
  } catch (error) {
    console.log("Error ending user session: ", error);
    return res.status(500).send({ message: "Error ending user session" });
  }
};

exports.deletePatienSessionData = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).send({ message: "Patient ID is required." });
    }

    const patient_notes = await knex("patient_notes")
      .where({ patient_id: id })
      .delete();
    const observations = await knex("observations")
      .where({ patient_id: id })
      .delete();
    const prescriptions = await knex("prescriptions")
      .where({ patient_id: id })
      .delete();
    const investigation_reports = await knex("investigation_reports")
      .where({ patient_id: id })
      .delete();
    const fluid_balance = await knex("fluid_balance")
      .where({ patient_id: id })
      .delete();
    const request_investigation = await knex("request_investigation")
      .where({ patient_id: id })
      .delete();

    res.status(200).send({ message: "Patient Deatils Deleted successfully" });
  } catch (error) {
    console.log("Error in deleting patient details: ", error);
    res.status(500).send({ message: "Error in deleting patient details" });
  }
};

exports.getAllActiveSessions = async (req, res) => {
  const { orgId } = req.params;
  try {
    const query = knex("session")
      .leftJoin("users", "session.createdBy", "users.id")
      .leftJoin("patient_records", "session.patient", "patient_records.id")
      .where("users.organisation_id", orgId)
      .where("session.state", "active")
      .select("session.*", "patient_records.name as patient_name")
      .orderBy("session.startTime", "desc");

    const Sessions = await query;

    res.status(200).json(Sessions);
  } catch (error) {
    console.error("Error fetching Sessions:", error);
    res.status(500).json({ message: "Failed to fetch Sessions" });
  }
};

<<<<<<< HEAD
exports.checkActiveSessionForPatient = async (req, res) => {
  const { orgId } = req.params;
  try {
    console.log("Checking session limit for orgId:", orgId);

    const org = await knex("organisations")
      .where({ id: orgId })
      .first();

    if (!org) {
      console.log("Organisation not found for orgId:", orgId);
      return res.status(404).json({
        hasActiveSession: false,
        message: "Organisation not found"
      });
    }

    console.log("Organisation data:", org);

    let sessionsAllowed = org.sessions_allowed != null ? Number(org.sessions_allowed) : null;
    let sessionsUsed;

    if (sessionsAllowed == null) {
      // sessions_allowed not set — count dynamically from sessions table via org's user IDs
      const orgUsers = await knex("users")
        .where({ organisation_id: org.id })
        .whereNot({ role: "Superadmin" })
        .select("id");

      const userIds = orgUsers.map((u) => u.id);

      if (userIds.length > 0) {
        const countResult = await knex("sessions")
          .whereIn("createdBy", userIds)
          .count("id as total")
          .first();
        sessionsUsed = Number(countResult?.total ?? 0);
      } else {
        sessionsUsed = 0;
      }

      // Also try to get the limit from plans table
      if (org.planType) {
        const plan = await knex("plans").where({ plan_type: org.planType }).first();
        if (plan && plan.concurrent_simulations != null && plan.concurrent_simulations !== "unlimited") {
          sessionsAllowed = Number(plan.concurrent_simulations);
        }
      }
    } else {
      sessionsUsed = Number(org.sessions_used ?? 0);
    }

    if (sessionsAllowed != null && sessionsAllowed > 0 && sessionsUsed >= sessionsAllowed) {
      res.status(200).json({
        hasActiveSession: true,
        sessionsUsed,
        sessionsAllowed,
        message: `Session limit reached. ${sessionsUsed}/${sessionsAllowed} sessions used.`
      });
    } else {
      res.status(200).json({
        hasActiveSession: false,
        sessionsUsed,
        sessionsAllowed,
        message: "Sessions available"
      });
    }
  } catch (error) {
    console.error("Error checking session limit:", error);
    res.status(500).json({ message: "Error checking session status", error: error.message });
  }
};

exports.getSessionDetails1 = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ message: "sessionId is required." });
  }

  try {
    const session = await knex("session as s")
      .leftJoin("users as creator", "s.createdBy", "creator.id")
      .leftJoin("patient_records as p", "s.patient", "p.id")
      .select(
        "s.id",
        "s.name as session_name",
        "s.duration",
        "s.startTime",
        "s.endTime",
        "s.state",
        "s.patient as patient_id",
        "p.name as patient_name",
        "creator.id as created_by_id",
        "creator.fname as created_by_fname",
        "creator.lname as created_by_lname",
        "creator.username as created_by_username",
        "creator.uemail as created_by_email",
        "s.participants"
      )
      .where("s.id", sessionId)
      .first();

    if (!session) {
      return res.status(401).json({ message: "Session not found." });
    }

    const participants = (() => {
      if (!session.participants) return [];
      if (Array.isArray(session.participants)) return session.participants;
      try {
        return JSON.parse(session.participants);
      } catch (error) {
        console.error("Failed to parse session participants:", error);
        return [];
      }
    })();

    const participantIds = participants
      .map((participant) => Number(participant.id))
      .filter((id) => Number.isFinite(id));

    const userRecords = participantIds.length
      ? await knex("users")
        .whereIn("id", participantIds)
        .select("id", "fname", "lname", "username", "uemail", "role")
      : [];

    const start = session.startTime ? new Date(session.startTime) : null;
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const timeRangeReady = start && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime());

    const participantFilter = (column) =>
      participantIds.length > 0
        ? knex.raw(`?? IN (${participantIds.map(() => "?").join(",")})`, [
          column,
          ...participantIds,
        ])
        : knex.raw("1 = 0");

    const notesQuery = knex("patient_notes as n")
      .leftJoin("users as u", "n.doctor_id", "u.id")
      .select(
        "n.id",
        "n.patient_id",
        "n.title",
        "n.content",
        "n.attachments",
        "n.report_id",
        "n.doctor_id",
        "n.created_at",
        "u.fname as user_fname",
        "u.lname as user_lname",
        "u.username as user_username",
        "u.uemail as user_email",
        "u.role as user_role"
      )
      .where("n.patient_id", session.patient_id || session.patient)
      .andWhere(participantIds.length > 0 ? participantFilter("n.doctor_id") : knex.raw("1 = 0"));

    const prescriptionsQuery = knex("prescriptions as p")
      .leftJoin("users as u", "p.doctor_id", "u.id")
      .select(
        "p.id",
        "p.patient_id",
        "p.doctor_id",
        "p.medication_name",
        "p.indication",
        "p.description",
        "p.start_date",
        "p.days_given",
        "p.administration_time",
        "p.dose",
        "p.route",
        "p.Unit as unit",
        "p.Frequency as frequency",
        "p.Instructions as instructions",
        "p.Duration as duration",
        "p.created_at",
        "u.fname as user_fname",
        "u.lname as user_lname",
        "u.username as user_username",
        "u.uemail as user_email",
        "u.role as user_role"
      )
      .where("p.patient_id", session.patient_id || session.patient)
      .andWhere(participantIds.length > 0 ? participantFilter("p.doctor_id") : knex.raw("1 = 0"));

    const observationsQuery = knex("observations as o")
      .leftJoin("users as u", "o.observations_by", "u.id")
      .select(
        "o.id",
        "o.patient_id",
        "o.respiratory_rate",
        "o.o2_sats",
        "o.oxygen_delivery",
        "o.blood_pressure",
        "o.pulse",
        "o.consciousness as gcs",
        "o.temperature",
        "o.news2_score",
        "o.pews2",
        "o.mews2",
        "o.observations_by",
        "o.time_stamp",
        "o.created_at",
        "u.fname as user_fname",
        "u.lname as user_lname",
        "u.username as user_username",
        "u.uemail as user_email",
        "u.role as user_role"
      )
      .where("o.patient_id", session.patient_id || session.patient)
      .andWhere(participantIds.length > 0 ? participantFilter("o.observations_by") : knex.raw("1 = 0"));

    const investigationsQuery = knex("request_investigation as ri")
      .leftJoin("users as u", "ri.request_by", "u.id")
      .select(
        "ri.id",
        "ri.patient_id",
        "ri.request_by",
        "ri.category",
        "ri.test_name",
        "ri.status",
        "ri.response_reason",
        "ri.created_at",
        "u.fname as user_fname",
        "u.lname as user_lname",
        "u.username as user_username",
        "u.uemail as user_email",
        "u.role as user_role"
      )
      .where("ri.patient_id", session.patient_id || session.patient)
      .andWhere(participantIds.length > 0 ? participantFilter("ri.request_by") : knex.raw("1 = 0"));

    if (timeRangeReady) {
      notesQuery.andWhereBetween("n.created_at", [start, end]);
      prescriptionsQuery.andWhereBetween("p.created_at", [start, end]);
      observationsQuery.andWhereBetween("o.created_at", [start, end]);
      investigationsQuery.andWhereBetween("ri.created_at", [start, end]);
    }

    const conversationSessions = await knex("conversation_sessions as cs")
      .leftJoin("users as u", "cs.user_id", "u.id")
      .select(
        "cs.id",
        "cs.session_id",
        "cs.user_id",
        "cs.patient_id",
        "cs.created_at",
        "cs.updated_at",
        "u.fname as user_fname",
        "u.lname as user_lname",
        "u.username as user_username",
        "u.uemail as user_email",
        "u.role as user_role"
      )
      .where("cs.session_id", session.id)
      // Removing strict patient_id check as session_id is specific enough
      .andWhere(function () {
        if (participantIds.length > 0) {
          this.whereIn("cs.user_id", participantIds);
        }
      });

    const conversationIds = conversationSessions.map((item) => item.id);
    const conversationMessages = conversationIds.length
      ? await knex("conversation_messages")
        .whereIn("conversation_id", conversationIds)
        .select("id", "conversation_id", "person", "query", "created_at")
        .orderBy("created_at", "asc")
      : [];

    const participantMap = new Map();

    participants.forEach((participant) => {
      const participantId = Number(participant.id);
      participantMap.set(participantId, {
        ...participant,
        id: participantId,
        activities: {
          notes: [],
          prescriptions: [],
          observations: [],
          investigations: [],
          conversations: [],
        },
        counts: {
          notes: 0,
          prescriptions: 0,
          observations: 0,
          investigations: 0,
          conversations: 0,
        },
      });
    });

    const getParticipantBucket = (userId) => participantMap.get(Number(userId));

    const notes = await notesQuery.orderBy("n.created_at", "desc");
    const prescriptions = await prescriptionsQuery.orderBy("p.created_at", "desc");
    const observations = await observationsQuery.orderBy("o.created_at", "desc");
    const investigations = await investigationsQuery.orderBy("ri.created_at", "desc");

    const conversationMessageMap = conversationMessages.reduce((acc, message) => {
      if (!acc[message.conversation_id]) acc[message.conversation_id] = [];
      acc[message.conversation_id].push(message);
      return acc;
    }, {});

    conversationSessions.forEach((conversation) => {
      const bucket = getParticipantBucket(conversation.user_id);
      const sessionMessages = conversationMessageMap[conversation.id] || [];

      if (bucket) {
        bucket.activities.conversations.push({
          ...conversation,
          messages: sessionMessages,
        });
        bucket.counts.conversations += 1;
      }
    });

    notes.forEach((note) => {
      const bucket = getParticipantBucket(note.doctor_id);
      if (bucket) {
        bucket.activities.notes.push(note);
        bucket.counts.notes += 1;
      }
    });

    prescriptions.forEach((prescription) => {
      const bucket = getParticipantBucket(prescription.doctor_id);
      if (bucket) {
        bucket.activities.prescriptions.push(prescription);
        bucket.counts.prescriptions += 1;
      }
    });

    observations.forEach((observation) => {
      const bucket = getParticipantBucket(observation.observations_by);
      if (bucket) {
        bucket.activities.observations.push(observation);
        bucket.counts.observations += 1;
      }
    });

    investigations.forEach((investigation) => {
      const bucket = getParticipantBucket(investigation.request_by);
      if (bucket) {
        bucket.activities.investigations.push(investigation);
        bucket.counts.investigations += 1;
      }
    });

    const enrichedParticipants = participants.map((participant) => {
      const participantId = Number(participant.id);
      const userRecord = userRecords.find((user) => Number(user.id) === participantId);
      const bucket = participantMap.get(participantId);

      return {
        ...participant,
        id: participantId,
        name:
          participant.name ||
          [userRecord?.fname, userRecord?.lname].filter(Boolean).join(" ") ||
          userRecord?.username ||
          "Unknown User",
        uemail: participant.uemail || userRecord?.uemail || "",
        role: participant.role || userRecord?.role || "",
        user: userRecord || null,
        activities: bucket ? bucket.activities : {
          notes: [],
          prescriptions: [],
          observations: [],
          investigations: [],
          conversations: [],
        },
        counts: bucket ? bucket.counts : {
          notes: 0,
          prescriptions: 0,
          observations: 0,
          investigations: 0,
          conversations: 0,
        },
      };
    });

    const createdByName = [
      session.created_by_fname,
      session.created_by_lname,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || session.created_by_username || session.created_by_email || "Unknown";

    return res.status(200).json({
      session: {
        id: session.id,
        session_name: session.session_name,
        duration: session.duration,
        startTime: session.startTime,
        endTime: session.endTime,
        state: session.state,
        patient_id: session.patient_id,
        patient_name: session.patient_name,
        created_by: createdByName,
        participants: enrichedParticipants,
      },
      summary: {
        participants: enrichedParticipants.length,
        notes: notes.length,
        prescriptions: prescriptions.length,
        observations: observations.length,
        investigations: investigations.length,
        conversations: conversationSessions.length,
      },
    });
  } catch (error) {
    console.error("Error getting session details:", error);
    return res.status(500).json({ message: "Error getting session details" });
  }
};

=======
>>>>>>> refs/remotes/origin/main
const getBusyWardUserIds = async (orgId) => {
  try {
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

          if (data.faculty && Array.isArray(data.faculty))
            busyUserIds.push(...data.faculty);
          if (data.Observer && Array.isArray(data.Observer))
            busyUserIds.push(...data.Observer);
          Object.keys(data).forEach((key) => {
            if (key.startsWith("zone") && data[key].userId)
              busyUserIds.push(data[key].userId);
          });
        } catch (err) {
          console.error(err);
        }
      }
    });

    return [...new Set(busyUserIds)].map((id) => parseInt(id));
  } catch (error) {
    return [];
  }
};

exports.getAllSession = async (req, res) => {
  try {
    const sessions = await knex("session")
      .leftJoin("users as creator", "session.createdBy", "creator.id")
      .leftJoin("users as ender", "session.endedBy", "ender.id")
      .leftJoin("patient_records", "session.patient", "patient_records.id")
      .select(
        "session.*",
        "patient_records.name as patient_name",

        // created by
        "creator.fname as creator_fname",
        "creator.lname as creator_lname",
        "creator.uemail as creator_uemail",

        // ended by
        "ender.fname as endedby_fname",
        "ender.lname as endedby_lname",
        "ender.uemail as endedby_uemail",
      )
      .orderBy("session.startTime", "desc");

    const enrichedData = sessions.map((session) => {
      if (session.endTime && session.startTime) {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
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
      return session;
    });

    res.status(200).send({ data: enrichedData });
  } catch (error) {
    console.log("Error getting session: ", error);
    res.status(500).send({ message: "Error getting session" });
  }
};

// sessionController.js

exports.deleteIndividualSessions = async (req, res) => {
  try {
    const { sessionIds, adminName } = req.body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No session IDs provided for deletion.",
      });
    }

    const sessionsToDelete = await knex("session").whereIn("id", sessionIds);

    if (sessionsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching sessions found to delete.",
      });
    }

    await knex("session").whereIn("id", sessionIds).del();

    try {
      const logEntries = sessionsToDelete.map((session) => ({
        user_id: req.user?.id || 0,
        action_type: "DELETE",
        entity_name: "Session",
        entity_id: session.id,
        details: JSON.stringify({
          deleted_by: adminName || "Admin",
          session_name: session.name,
          start_time: session.startTime,
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

exports.getSessionByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
<<<<<<< HEAD
    console.log(userId, "userIduserIduserId");
=======
>>>>>>> refs/remotes/origin/main
    // 🔹 Normal Sessions
    const sessions = await knex("session")
      .select(
        knex.raw("DATE_FORMAT(startTime, '%Y-%m') as month"),
        knex.raw("COUNT(*) as sessionCount"),
      )
      .whereRaw("JSON_CONTAINS(participants, JSON_OBJECT('id', ?), '$')", [
        Number(userId),
      ])
      .groupByRaw("DATE_FORMAT(startTime, '%Y-%m')");
<<<<<<< HEAD
    console.log(sessions, "sesiionssssssssssss");
=======

>>>>>>> refs/remotes/origin/main
    // 🔹 Ward Sessions
    const wardSessions = await knex("wardsession")
      .select(
        knex.raw("DATE_FORMAT(start_time, '%Y-%m') as month"),
        knex.raw("COUNT(*) as wardSessionCount"),
      )
      .where(function () {
        this.whereRaw(
          "JSON_CONTAINS(assignments->'$.faculty', JSON_ARRAY(?))",
          [Number(userId)],
        )
          .orWhereRaw(
            "JSON_CONTAINS(assignments->'$.Observer', JSON_ARRAY(?))",
            [Number(userId)],
          )
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone1.userId') = ?", [
            Number(userId),
          ])
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone2.userId') = ?", [
            Number(userId),
          ])
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone3.userId') = ?", [
            Number(userId),
          ])
          .orWhereRaw("JSON_EXTRACT(assignments, '$.zone4.userId') = ?", [
            Number(userId),
          ]);
      })
      .groupByRaw("DATE_FORMAT(start_time, '%Y-%m')");
<<<<<<< HEAD
    console.log(wardSessions, "wardSessionswardSessions");
=======

>>>>>>> refs/remotes/origin/main
    // 🔥 Convert to object map
    const resultMap = {};

    sessions.forEach((item) => {
      if (!resultMap[item.month]) {
        resultMap[item.month] = {
          month: item.month,
          sessionCount: 0,
          wardSessionCount: 0,
        };
      }
      resultMap[item.month].sessionCount = Number(item.sessionCount);
    });

    wardSessions.forEach((item) => {
      if (!resultMap[item.month]) {
        resultMap[item.month] = {
          month: item.month,
          sessionCount: 0,
          wardSessionCount: 0,
        };
      }
      resultMap[item.month].wardSessionCount = Number(item.wardSessionCount);
    });

    const finalResult = Object.values(resultMap).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    res.status(200).json(finalResult);
  } catch (error) {
    console.error("Error fetching Sessions:", error);
    res.status(500).json({ message: "Failed to fetch Sessions" });
  }
};
