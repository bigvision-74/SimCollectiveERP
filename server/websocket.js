const socketIO = require("socket.io");
const Knex = require("knex");
const knexConfig = require("./knexfile").development;
const knex = Knex(knexConfig);

let io;

const initWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Backend] New connection: ${socket.id}`);

    socket.on("authenticate", async (userEmail) => {
      try {
        const user = await knex("users").where({ uemail: userEmail }).first();
        if (!user) return;

        // Join organization room
        const orgRoom = `org_${user.organisation_id}`;
        socket.join(orgRoom);

        // // Join existing session if any
        // const activeSession = await knex("session")
        //   .where({
        //     patient: user.patient_id, // or your patient association
        //     state: "active"
        //   })
        //   .first();

        // if (activeSession) {
        //   socket.join(`session_${activeSession.id}`);
        // }
      } catch (error) {
        console.error("Auth error:", error);
      }
    });

    socket.on("joinOrg", ({ orgId }) => {
      const orgRoom = `org_${orgId}`;
      socket.join(orgRoom);
      console.log(`[Backend] Socket ${socket.id} joined room: ${orgRoom}`);
    });

    socket.on("joinSession", ({ sessionId, userId }) => {
      const sessionRoom = `session_${sessionId}`;
      socket.join(sessionRoom);
      console.log(`[Backend] User ${userId} joined session: ${sessionRoom}`);
      socket.to(sessionRoom).emit("userJoined", { userId });
    });

    socket.on("sessionUpdate", ({ sessionId, data }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("updateData", data);
      console.log(`[Backend] Session update sent to ${sessionRoom}`);
    });

    socket.on("endSession", ({ sessionId }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("session:ended");
      console.log(`[Backend] Session ${sessionId} ended`);
    });

    socket.on("subscribeToRefresh", ({ roomName }) => {
      socket.join(`refresh`);
      console.log(
        `[Backend] Socket ${socket.id} subscribed to refresh room: refresh_${roomName}`
      );
    });

    socket.on("disconnect", () => {
      console.log(`[Backend] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initWebSocket, getIO };
