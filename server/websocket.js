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

  io.use(async (socket, next) => {
    const userEmail = socket.handshake.auth.userEmail;
    if (!userEmail) {
      return next(new Error("Authentication error: User email not provided"));
    }
    try {
      const user = await knex("users").where({ uemail: userEmail }).first();
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Backend] New connection: ${socket.id}`);

    const orgRoom = `org_${socket.user.organisation_id}`;
    socket.join(orgRoom);
    console.log(
      `[Backend] Socket ${socket.id} with user ${socket.user.uemail} automatically joined room: ${orgRoom}`
    );

    socket.on("joinSession", async ({ sessionId, userId }) => {
      const sessionRoom = `session_${sessionId}`;
      const currentUser = socket.user;
      const userRole = currentUser.role;

      if (userRole === "admin") {
        socket.join(sessionRoom);
        console.log(`[Backend] Admin ${userId} joined session: ${sessionRoom}`);
        socket.to(sessionRoom).emit("userJoined", { userId });
        return;
      }

      const limits = {
        user: 3,
        observer: 1,
        faculty: 1,
      };

      if (!limits.hasOwnProperty(userRole)) {
        socket.join(sessionRoom);
        console.log(`[Backend] User ${userId} (${userRole}) joined session ${sessionRoom} (role is not limited).`);
        socket.to(sessionRoom).emit("userJoined", { userId });
        return;
      }

      try {
        const eligibleUsers = await knex("users")
          .select("id")
          .where({
            organisation_id: currentUser.organisation_id,
            role: userRole,
          })
          .orderBy("lastLogin", "asc") 
          .limit(limits[userRole]);

        const isEligible = eligibleUsers.some(user => user.id === currentUser.id);

        if (isEligible) {
          socket.join(sessionRoom);
          console.log(`[Backend] User ${userId} (${userRole}) is eligible and joined session: ${sessionRoom}`);
          socket.to(sessionRoom).emit("userJoined", { userId });
        } else {
          console.log(`[Backend] Denied ${userId} (${userRole}) from joining ${sessionRoom}: Not in the top ${limits[userRole]} by login time.`);
          socket.emit("joinError", {
            message: `Session access is limited to the first ${limits[userRole]} ${userRole}(s) based on login time.`,
          });
        }
      } catch (error) {
        console.error(`[Backend] Error during joinSession eligibility check: ${error.message}`);
        socket.emit("joinError", { message: "An server error occurred while trying to join the session." });
      }
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

    socket.on("subscribeToPatientUpdates", ({ patientId }) => {
      if (!patientId) return;
      const roomName = `patient_${patientId}`;
      socket.join(roomName);
      console.log(
        `[Backend] Socket ${socket.id} subscribed to updates for: ${roomName}`
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