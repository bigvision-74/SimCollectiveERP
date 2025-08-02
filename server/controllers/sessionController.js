const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { getIO } = require("../websocket");

exports.createSession = async (req, res) => {
  console.log(req.body);
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

    console.log(
      `[Backend] Emitting 'session:started' to room: ${user.organisation_id.toString()} with data:`,
      {
        sessionId: sessionId,
        patientId: patient,
      }
    );

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

    if (session.state === 'ended') {
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
      
      io.to(`org_${user.organisation_id}`).emit("session:ended", {
        sessionId: id,
      });
    }

    res.status(200).send({ message: "Session ended successfully" });
  } catch (error) {
    console.log("Error ending session: ", error);
    res.status(500).send({ message: "Error ending session" });
  }
};
