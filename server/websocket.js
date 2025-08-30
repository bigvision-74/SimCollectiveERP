const socketIO = require("socket.io");
const Knex = require("knex");
const { name } = require("ejs");
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

  // io.use(async (socket, next) => {
  //   const userEmail = socket.handshake.auth.userEmail;
  //   if (!userEmail) {
  //     return next(new Error("Authentication error: User email not provided"));
  //   }
  //   try {
  //     const user = await knex("users").where({ uemail: userEmail }).first();
  //     if (!user) {
  //       return next(new Error("Authentication error: User not found"));
  //     }
  //     socket.user = user;
  //     next();
  //   } catch (error) {
  //     console.error("Auth middleware error:", error);
  //     next(new Error("Authentication error"));
  //   }
  // });

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
      // --- Start of added logic ---
      socket.join(userEmail); // Join a room specific to the user's email
      console.log(
        `[Backend] Socket ${socket.id} joined user-specific room: ${userEmail}`
      );
      // --- End of added logic ---
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

    socket.on("paticipantAdd", ({ sessionId, userId, sessionData }) => {
      console.log("hhhhhhhhhhhhhhh");

      const sessionRoom = `session_${sessionId}`;

      socket.to(sessionRoom).emit("paticipantAdd", {
        sessionId,
        userId,
        sessionData,
      });
      if (sessionData) {
        socket.emit("session:joined", sessionData);
      }
    });

    socket.on("joinSession", async ({ sessionId, userId, sessionData }) => {
      const sessionRoom = `session_${sessionId}`;
      const currentUser = socket.user;
      const userRole = currentUser.role.toLowerCase();

      if (userRole === "admin") {
        socket.join(sessionRoom);
        console.log(`[Backend] Admin ${userId} joined session: ${sessionRoom}`);
        socket.to(sessionRoom).emit("userJoined", { userId });
        if (sessionData) {
          socket.emit("session:joined", sessionData);
        }
        return;
      }

      const limits = {
        user: 3,
        observer: 1,
        faculty: 1,
      };

      if (!limits.hasOwnProperty(userRole)) {
        socket.join(sessionRoom);
        console.log(
          `[Backend] User ${userId} (${currentUser.role}) joined session ${sessionRoom} (role has no limits).`
        );
        socket.to(sessionRoom).emit("userJoined", { userId });
        if (sessionData) {
          socket.emit("session:joined", sessionData);
        }
        return;
      }

      try {
        const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
        const eligibleUsers = await knex("users")
          .select("id")
          .where({
            organisation_id: currentUser.organisation_id,
          })
          .whereRaw("LOWER(role) = ?", [userRole])
          .where("lastLogin", ">=", sixHoursAgo)
          .orderBy("lastLogin", "asc")
          .limit(limits[userRole]);

        const eligibleUserIds = eligibleUsers.map((user) => user.id);
        console.log(eligibleUserIds, "eligibleUserIdseligibleUserIds");
        const isEligible = eligibleUserIds.includes(currentUser.id);
console.log(isEligible, "isEligibleisEligibleisEligibleisEligible");
        if (isEligible) {
          socket.join(sessionRoom);
          console.log(
            `[Backend] User ${userId} (${currentUser.role}) is eligible and joined session: ${sessionRoom}`
          );
          socket.to(sessionRoom).emit("userJoined", { userId });

          socket.to(sessionRoom).emit("paticipantAdd", {
            userId,
            sessionData: sessionData || null,
          });

          if (sessionData) {
            socket.emit("session:joined", sessionData);
          }
        } else {
          console.log(
            `[Backend] Denied ${userId} (${currentUser.role}) from joining ${sessionRoom}: Not eligible.`
          );
          socket.emit("joinError", {
            message: `Session access is limited for the '${currentUser.role}' role.`,
          });
        }
      } catch (error) {
        console.error(
          `[Backend] Error during joinSession eligibility check: ${error.message}`
        );
        socket.emit("joinError", { message: "A server error occurred." });
      }
    });

    socket.on("getParticipantList", async ({ sessionId, orgid }) => {
      if (!sessionId) return;

      const sessionRoom = `session_${sessionId}`;

      try {
        const dbUsers = await knex("users")
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

        const socketsInRoom = await io.in(sessionRoom).fetchSockets();
        const connectedIds = socketsInRoom.map((sock) => sock.user.id);
        const participants = dbUsers.map((user) => ({
          id: user.id,
          name: `${user.fname} ${user.lname}`,
          uemail: user.uemail,
          role: user.role,
          inRoom: connectedIds.includes(user.id),
        }));

        socket.emit("participantListUpdate", { participants });
      } catch (error) {
        console.error(
          `[Backend] Error fetching participant list for ${sessionRoom}:`,
          error
        );
      }
    });

    socket.on("sessionUpdate", ({ sessionId, data }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("updateData", data);
      console.log(`[Backend] Session update sent to ${sessionRoom}`);
    });

    socket.on("removeUser", async ({ sessionId, userid }) => {
      const sessionRoom = `session_${sessionId}`;

      try {
        const socketsInRoom = await io.in(sessionRoom).fetchSockets();
        const targetSocket = socketsInRoom.find((s) => s.user.id == userid);

        if (targetSocket) {
          await targetSocket.leave(sessionRoom);
          targetSocket.disconnect(true);
          console.log(
            `[Backend] User ${userid} disconnected and removed from ${sessionRoom}`
          );
        }

        io.to(sessionRoom).emit("removeUser", userid);
      } catch (err) {
        console.error(
          `[Backend] Error removing user from ${sessionRoom}:`,
          err
        );
      }
    });

    socket.on("addUser", ({ sessionId, userid }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("addUser", userid);
      console.log(`[Backend] Add user to Session ${sessionRoom}`);
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
