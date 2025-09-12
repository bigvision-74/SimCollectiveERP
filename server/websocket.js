const socketIO = require("socket.io");
const Knex = require("knex");
const { name } = require("ejs");
const knexConfig = require("./knexfile").development;
const knex = Knex(knexConfig);
let io;

const initWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [process.env.CLIENT_URL , "http://localhost:5173" , "https://inpatientsim.com" , "https://www.inpatientsim.com" ,  "https://simvpr.com"],
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
      console.log(
        `[Backend] Socket ${socket.id} joined user-specific room: ${userEmail}`
      );
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
        console.log(
          `[Backend] Denied ${userId} from joining ${sessionRoom}: Already in another session.`
        );
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
        console.log(
          `[Backend] Session starter ${userId} (${userRole}) granted priority access to ${sessionRoom}`
        );

        socket.to(sessionRoom).emit("userJoined", { userId });
        socket.to(sessionRoom).emit("paticipantAdd", { userId, sessionData });

        socket.emit("session:joined", sessionData);
        return; 
      }

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

      const socketsInRoom = await io.in(sessionRoom).fetchSockets();
      const currentCountInSession = socketsInRoom.filter(
        (sock) => sock.user && sock.user.role.toLowerCase() === userRole
      ).length;

      const remainingSlots = limits[userRole] - currentCountInSession;

      if (remainingSlots <= 0) {
        console.log(
          `[Backend] Denied ${userId} (${userRole}) from joining ${sessionRoom}: Role limit reached.`
        );
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
        console.log(
          "[Backend] getParticipantList called without sessionId or orgid."
        );
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      console.log(`[Backend] Fetching list for ${sessionRoom} in org ${orgid}`);

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
        console.log("[Backend] User Session Map:", userSessionMap);

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

        console.log(
          `[Backend] Sending participant list for ${sessionRoom} with ${participants.length} users.`
        );
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
      console.log(`[Backend] Session update sent to ${sessionRoom}`);
    });

    socket.on("server:removeUser", async ({ sessionId, userid }) => {
      const sessionRoom = `session_${sessionId}`;

      try {
        // 1. Find the target user's socket within the specific session room.
        const socketsInRoom = await io.in(sessionRoom).fetchSockets();
        const targetSocket = socketsInRoom.find(
          (s) => s.user && s.user.id == userid
        );

        // 2. If the user is found, kick them and disconnect them.
        if (targetSocket) {
          // Notify the user they are being removed.
          targetSocket.emit("session:removed", {
            message: "You have been removed from the session.",
          });

          // Force them to leave the room and disconnect the socket.
          targetSocket.leave(sessionRoom);
          targetSocket.disconnect(true);
          console.log(
            `[Backend] User ${userid} has been removed from ${sessionRoom}`
          );
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
        console.log(
          `[Backend] Broadcasted updated participant list to ${sessionRoom}.`
        );
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
