const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { getIO } = require("../websocket");

exports.createSession = async (req, res) => {
  const { patient, createdBy, name, duration } = req.body;
  try {
    const io = getIO();
    const user = await knex("users").where({ uemail: createdBy }).first();

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
      patientId: patient,
      startedBy: user.id,
      sessionName: name,
      duration,
      startTime: startTime.toISOString(),
    });

    res
      .status(200)
      .send({ id: sessionId, message: "Session Created Successfully" });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).send({ message: "Error creating session" });
  }
};

exports.addParticipant = async (req, res) => {
  const { patient, createdBy, name, duration, userId, sessionId } = req.body;
  try {
    const io = getIO();

    const user = await knex("users").where({ id: userId }).first();
    // if (!user) {
    //   return res.status(404).send({ message: "User not found" });
    // }

    const startTime = new Date();
    const sessionRoom = `session_${sessionId}`;

    const sockets = await io.fetchSockets();
    const targetSocket = sockets.find(
      (sock) => sock.user?.id === parseInt(userId)
    );

    if (targetSocket) {
      await targetSocket.join(sessionRoom);
      console.log(`[Backend] User ${userId} joined session: ${sessionRoom}`);

      targetSocket.emit("paticipantAdd", {
        sessionId,
        userId,
        sessionData: {
          patientId: patient,
          startedBy: userId,
          sessionName: name,
          duration,
          startTime: startTime.toISOString(),
        },
      });

      io.to(sessionRoom).emit("userJoined", { userId });

      const dbUsers = await knex("users")
        .whereNotNull("lastLogin")
        .where({ organisation_id: user.organisation_id })
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

      const socketsInRoom = await io.in(sessionRoom).fetchSockets();
      const connectedIds = socketsInRoom.map((sock) => sock.user.id);

      const participants = dbUsers.map((user) => ({
        id: user.id,
        name: `${user.fname} ${user.lname}`,
        uemail: user.uemail,
        role: user.role,
        inRoom: connectedIds.includes(user.id),
      }));

      io.to(sessionRoom).emit("participantListUpdate", { participants });
      console.log(
        `[Backend] Emitted updated participant list for session ${sessionRoom}`
      );
    } else {
      console.log(
        `[Backend] User ${userId} not connected, cannot add to session`
      );
    }

    res.status(200).send({
      id: sessionId,
      message: "Participant invited successfully",
      added: !!targetSocket,
    });
  } catch (error) {
    console.log("Error: ", error);
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
  const { participants } = req.body;

  try {
    if (!sessionId || !userid) {
      return res
        .status(400)
        .send({ message: "Session ID and User ID are required." });
    }

    const io = getIO();

    const session = await knex("session").where({ id: sessionId }).first();
    if (!session) {
      return res.status(404).send({ message: "Session not found." });
    }

    const updatedParticipants = (participants || []).filter(
      (p) => String(p.id) !== String(userid)
    );

    await knex("session")
      .where({ id: sessionId })
      .update({ participants: JSON.stringify(updatedParticipants) });

    const sessionRoom = `session_${sessionId}`;

    // Notify others in the room that a user was removed
    io.to(sessionRoom).emit("removeUser", { sessionId, userid });
    console.log(`[Backend] Remove user ${userid} from session ${sessionRoom}`);

    // Force the user's socket to leave the room and notify them
    io.sockets.sockets.forEach((socket) => {
      if (String(socket.user?.id) === String(userid)) {
        console.log(
          `[Backend] Forcing socket ${socket.id} (${userid}) to leave ${sessionRoom}`
        );
        socket.leave(sessionRoom);
        // socket.emit("session:ended", { sessionId });
      }
    });
    const user = await knex("users").where({ id: userid }).first();
    console.log(user, "useruseruseruser");
    // Get updated participant list with inRoom status
    const dbUsers = await knex("users")
      .whereNotNull("lastLogin")
      .where({ organisation_id: user.organisation_id })
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

    const socketsInRoom = await io.in(sessionRoom).fetchSockets();
    const connectedIds = socketsInRoom.map((sock) => sock.user.id);

    const participantList = dbUsers.map((user) => ({
      id: user.id,
      name: `${user.fname} ${user.lname}`,
      uemail: user.uemail,
      role: user.role,
      inRoom: connectedIds.includes(user.id), // This will be false for the removed user
    }));

    // Emit the updated participant list to all clients in the session
    io.to(sessionRoom).emit("participantListUpdate", {
      participants: participantList,
    });
    console.log(
      `[Backend] Emitted updated participant list for session ${sessionRoom}`
    );

    return res.status(200).send({
      message: "User removed from session successfully",
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
