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

    let virtualSessionId = 0;
    if (!roomType && !patientType) {
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
      .first();

    const sessionUsers = await knex("users")
      .where({ role: "User" })
      .orWhere({ organisation_id: user.organisation_id })
      .whereNotNull("fcm_token")
      .whereRaw("TRIM(fcm_token) <> ''");

    const tokens = sessionUsers.map((u) => u.fcm_token).filter(Boolean);
    if (tokens.length === 0) {
      console.log(
        "⚠️ No users with valid FCM tokens found. Skipping notification."
      );
      return;
    }

    for (const token of tokens) {
      const message = {
        notification: {
          title: "Session Started",
          body: `A new session started for patient ${sessionDetails.patient}.`,
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
        console.error(`❌ Error sending notification to token ${token}:`, err);

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

    res
      .status(200)
      .send({
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
      (sock) => sock.user && sock.user.id === parseInt(userId)
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
          r.startsWith("session_")
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
  const { id } = req.params;

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
      })
      .where({ id: id });

    await knex("virtual_section")
      .where("sessionId", id)
      .update("status", "ended");

    if (user && user.organisation_id) {
      console.log(
        `[Backend] Emitting session:ended to room: org_${user.organisation_id}, sessionId: ${id}`
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
      (s) => s.user && String(s.user.id) === String(userid)
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
        (p) => String(p.id) !== String(userid)
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
          r.startsWith("session_")
        );
        if (room) userSessionMap.set(sock.user.id, room);
      }
    });

    const allOrgUsers = await knex("users")
      .whereNotNull("lastLogin")
      .where({ organisation_id: orgid })
      .whereNotIn("id", busyWardUserIds)
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
