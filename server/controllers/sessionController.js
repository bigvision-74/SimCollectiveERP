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

    io.to(sessionRoom).emit("removeUser", { sessionId, userid });
    console.log(`[Backend] Remove user ${userid} from session ${sessionRoom}`);

    io.sockets.sockets.forEach((socket) => {
      if (String(socket.user?.id) === String(userid)) {
        console.log(
          `[Backend] Forcing socket ${socket.id} (${userid}) to leave ${sessionRoom}`
        );
        socket.leave(sessionRoom);
      }
    });
    const user = await knex("users").where({ id: userid }).first();

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
      .whereNotNull("lastLogin")
      .where({ organisation_id: orgid })
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
