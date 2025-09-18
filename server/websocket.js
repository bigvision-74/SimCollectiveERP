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
      socket.join(userEmail);
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {

    const orgRoom = `org_${socket.user.organisation_id}`;
    socket.join(orgRoom);

    socket.on("paticipantAdd", ({ sessionId, userId, sessionData }) => {
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

      const currentRooms = Array.from(socket.rooms);
      const inAnotherSession = currentRooms.some(
        (room) => room.startsWith("session_") && room !== sessionRoom
      );
      if (inAnotherSession) {
        return socket.emit("joinError", {
          message: "You are already participating in another session.",
        });
      }

      if (
        sessionData &&
        sessionData.startedBy &&
        currentUser.id == sessionData.startedBy
      ) {
        socket.join(sessionRoom);

        socket.to(sessionRoom).emit("userJoined", { userId });
        socket.to(sessionRoom).emit("paticipantAdd", { userId, sessionData });

        socket.emit("session:joined", sessionData);
        return;
      }

      if (userRole === "admin") {
        socket.join(sessionRoom);
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
        socket.to(sessionRoom).emit("userJoined", { userId });
        if (sessionData) {
          socket.emit("session:joined", sessionData);
        }
        return;
      }

      const socketsInRoom = await io.in(sessionRoom).fetchSockets();
      const currentCountInSession = socketsInRoom.filter(
        (sock) => sock.user && sock.user.role.toLowerCase() === userRole
      ).length;

      const remainingSlots = limits[userRole] - currentCountInSession;

      if (remainingSlots <= 0) {
        return socket.emit("joinError", {
          message: `The session is already full for the '${currentUser.role}' role.`,
        });
      }

      try {
        const allSockets = await io.fetchSockets();
        const activeUserIdsInSessions = new Set();
        allSockets.forEach((sock) => {
          if (sock.user) {
            const inASession = Array.from(sock.rooms).some((r) =>
              r.startsWith("session_")
            );
            if (inASession) {
              activeUserIdsInSessions.add(sock.user.id);
            }
          }
        });

        const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);

        const eligibleUsers = await knex("users")
          .select("id")
          .where({ organisation_id: currentUser.organisation_id })
          .whereRaw("LOWER(role) = ?", [userRole])
          .where("lastLogin", ">=", sixHoursAgo)
          .whereNotIn("id", Array.from(activeUserIdsInSessions))
          .orderBy("lastLogin", "asc")
          .limit(remainingSlots);

        const eligibleUserIds = eligibleUsers.map((user) => user.id);
        const isEligible = eligibleUserIds.includes(currentUser.id);

        if (isEligible) {
          socket.join(sessionRoom);
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
            `[Backend] Denied ${userId} (${currentUser.role}) from joining ${sessionRoom}: Not eligible or not next in line.`
          );
          socket.emit("joinError", {
            message: `Session access is limited for the '${currentUser.role}' role. Please wait for an open slot.`,
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
      if (!sessionId || !orgid) {
        return;
      }

      const sessionRoom = `session_${sessionId}`;

      try {
        const userSessionMap = new Map();
        const allSockets = await io.fetchSockets();

        allSockets.forEach((sock) => {
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

        const participants = allOrgUsers
          .filter((user) => {
            const usersCurrentSession = userSessionMap.get(user.id);

            if (!usersCurrentSession) {
              return true;
            }

            return usersCurrentSession === sessionRoom;
          })
          .map((user) => ({
            id: user.id,
            name: `${user.fname} ${user.lname}`,
            uemail: user.uemail,
            role: user.role,
            inRoom: userSessionMap.get(user.id) === sessionRoom,
          }));

        socket.emit("participantListUpdate", { participants });
      } catch (error) {
        console.error(
          `[Backend] Error fetching participant list for ${sessionRoom}:`,
          error
        );
        socket.emit("participantListError", {
          message: "Could not retrieve participant list.",
        });
      }
    });

    socket.on("sessionUpdate", ({ sessionId, data }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("updateData", data);
    });

    socket.on("server:removeUser", async ({ sessionId, userid }) => {
      const sessionRoom = `session_${sessionId}`;

      try {
        const socketsInRoom = await io.in(sessionRoom).fetchSockets();
        const targetSocket = socketsInRoom.find(
          (s) => s.user && s.user.id == userid
        );

        if (targetSocket) {
          targetSocket.emit("session:removed", {
            message: "You have been removed from the session.",
          });

          targetSocket.leave(sessionRoom);
          targetSocket.disconnect(true);
        } else {
          console.log(
            `[Backend] Could not find user ${userid} in session ${sessionRoom} to remove.`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 50));

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
      } catch (err) {
        console.error(
          `[Backend] Error during server:removeUser for ${sessionRoom}:`,
          err
        );
      }
    });

    socket.on("addUser", ({ sessionId, userid }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("addUser", userid);
    });

    socket.on("endSession", ({ sessionId }) => {
      const sessionRoom = `session_${sessionId}`;
      io.to(sessionRoom).emit("session:ended");
    });

    socket.on("subscribeToPatientUpdates", ({ patientId }) => {
      if (!patientId) return;
      const roomName = `patient_${patientId}`;
      socket.join(roomName);
    });

    socket.on(
      "session:change-visibility",
      ({ sessionId, section, isVisible }) => {
        const sessionRoom = `session_${sessionId}`;
        socket
          .to(sessionRoom)
          .emit("session:visibility-changed", { section, isVisible });
      }
    );

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
