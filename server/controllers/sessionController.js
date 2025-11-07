const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { getIO } = require("../websocket");
const { secondaryApp } = require('../firebase');

exports.createSession = async (req, res) => {
  const { patient, createdBy, name, duration } = req.body;
  try {
    const io = getIO();
    const user = await knex("users").where({ uemail: createdBy }).first();
    const patient_records = await knex("patient_records")
      .where({ id: patient })
      .first();

    const [sessionId] = await knex("session").insert({
      patient,
      name,
      duration,
      state: "active",
      createdBy: user.id,
      startTime: new Date(),
    });

    const startTime = new Date();

    io.to(`org_${user.organisation_id}`).emit("session:started", {
      sessionId: sessionId,
      patient_name: patient_records.name,
      patientId: patient,
      startedBy: user.id,
      sessionName: name,
      duration,
      startTime: startTime.toISOString(),
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

    const message = {
      notification: {
        title: "Session Started",
        body: `A new session started for patient ${sessionDetails.patient}.`,
      },
      tokens,
      data: {
        sessionId: sessionId,
        patientId: String(sessionDetails.patient),
      },
    };

    try {
      const response = await secondaryApp.messaging().sendAll(message);

      console.log(
        `✅ Notifications sent. Success: ${response.successCount}, Failure: ${response.failureCount}`
      );

      // Handle invalid tokens
      const failedTokens = [];
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      if (failedTokens.length > 0) {
        console.log("🧹 Removing invalid tokens:", failedTokens);

        await knex("users")
          .whereIn("fcm_token", failedTokens)
          .update({ fcm_token: null });
      }
    } catch (err) {
      console.error("❌ Error sending FCM notifications:", err);
    }

    res
      .status(200)
      .send({ id: sessionId, message: "Session Created Successfully" });
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

    const user = await knex("users").where({ id: userId }).first();
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const sockets = await io.fetchSockets();
    const targetSocket = sockets.find(
      (sock) => sock.user && sock.user.id === parseInt(userId)
    );

    let wasUserAdded = false;

    const patient_records = await knex("patient_records")
      .where({ id: patient })
      .first();

    if (targetSocket) {
      await targetSocket.join(sessionRoom);
      console.log(
        `[Backend] User ${userId} successfully joined session: ${sessionRoom}`
      );
      wasUserAdded = true;

      targetSocket.emit("paticipantAdd", {
        sessionId,
        userId,
        sessionData: {
          sessionId: sessionId,
          patientId: patient,
          type: type,
          patient_name: patient_records.name,
          startedBy: createdBy,
          sessionName: name,
          duration,
          startTime: new Date().toISOString(),
        },
      });

      io.to(sessionRoom).emit("userJoined", { userId });
    } else {
      console.log(
        `[Backend] User ${userId} not connected, cannot add to session`
      );
    }

    const orgid = user.organisation_id;
    const userSessionMap = new Map();
    const currentSockets = await io.fetchSockets();
    currentSockets.forEach((sock) => {
      if (sock.user) {
        const room = Array.from(sock.rooms).find((r) =>
          r.startsWith("session_")
        );
        if (room) {
          userSessionMap.set(sock.user.id, room);
        }
      }
    });

    const allOrgUsers = await knex("users")
      .where({ organisation_id: orgid })
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
    console.log(
      `[Backend] Emitted updated & correct participant list to session ${sessionRoom}`
    );

    res.status(200).send({
      id: sessionId,
      message: wasUserAdded
        ? "Participant added successfully."
        : "Participant is currently offline but has been invited.",
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

    console.log(user);

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
    if (!sessionId || !userid) {
      return res
        .status(400)
        .send({ message: "Session ID and User ID are required." });
    }

    const io = getIO(); // You already have access to io
    const sessionRoom = `session_${sessionId}`;

    // --- START: Logic moved from websocket.js ---

    // 1. Find the specific socket of the user to remove.
    const socketsInRoom = await io.in(sessionRoom).fetchSockets();
    const targetSocket = socketsInRoom.find(
      (s) => s.user && s.user.id == userid
    );

    console.log(
      "Found target socket:",
      targetSocket ? targetSocket.id : "Not Found"
    ); // This will now log!

    // 2. If the socket is found, send a message and disconnect them.
    if (targetSocket) {
      targetSocket.emit("session:removed", {
        message: "You have been removed from the session by an administrator.",
      });
      targetSocket.leave(sessionRoom);
      targetSocket.disconnect(true);
      console.log(
        `[Backend] Removed and disconnected socket ${targetSocket.id} for user ${userid}`
      );
    } else {
      console.log(
        `[Backend] Could not find an active socket for user ${userid} in session ${sessionRoom} to remove.`
      );
    }

    // Give a brief moment for the disconnection to process before updating the list.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 3. Get the updated list of participants and notify everyone remaining.
    const updatedSocketsInRoom = await io.in(sessionRoom).fetchSockets();
    const updatedParticipants = updatedSocketsInRoom.map((sock) => ({
      id: sock.user.id,
      name: `${sock.user.fname} ${sock.user.lname}`,
      uemail: sock.user.uemail,
      role: sock.user.role,
      inRoom: true,
    }));

    io.to(sessionRoom).emit("participantListUpdate", {
      participants: updatedParticipants,
    });
    console.log(
      `[Backend] Emitted updated participant list for session ${sessionRoom}`
    );

    // --- END: Logic moved from websocket.js ---

    // (You can remove the old manual database/participant update logic if this handles it)

    return res.status(200).send({
      message: "User removal process initiated successfully",
      participants: updatedParticipants,
    });
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
