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

// ... inside io.on("connection", (socket) => { ... })

socket.on("joinSession", async ({ sessionId, userId, sessionData }) => {
  const sessionRoom = `session_${sessionId}`;
  const currentUser = socket.user;
  const userRole = currentUser.role.toLowerCase();

  // 1. Check if user is already in another session.
  const currentRooms = Array.from(socket.rooms);
  const inAnotherSession = currentRooms.some(room => room.startsWith('session_') && room !== sessionRoom);
  if (inAnotherSession) {
    console.log(`[Backend] Denied ${userId} from joining ${sessionRoom}: Already in another session.`);
    return socket.emit("joinError", {
      message: "You are already participating in another session.",
    });
  }

  // --- START: New Priority Logic for the Session Starter ---
  // If the user trying to join is the one who initiated the session, grant them immediate access.
  if (sessionData && sessionData.startedBy && currentUser.id == sessionData.startedBy) {
    socket.join(sessionRoom);
    console.log(`[Backend] Session starter ${userId} (${userRole}) granted priority access to ${sessionRoom}`);
    
    // Notify others in the room that a user has joined.
    socket.to(sessionRoom).emit("userJoined", { userId });
    socket.to(sessionRoom).emit("paticipantAdd", { userId, sessionData });

    // Confirm to the starter that they have joined successfully.
    socket.emit("session:joined", sessionData);
    return; // IMPORTANT: Exit here to bypass all other limit and eligibility checks.
  }
  // --- END: New Priority Logic for the Session Starter ---

  // 2. Admins can bypass limits.
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

  // 3. Handle roles that have no limits.
  if (!limits.hasOwnProperty(userRole)) {
    socket.join(sessionRoom);
    console.log(`[Backend] User ${userId} (${currentUser.role}) joined session ${sessionRoom} (role has no limits).`);
    socket.to(sessionRoom).emit("userJoined", { userId });
    if (sessionData) {
      socket.emit("session:joined", sessionData);
    }
    return;
  }

  // 4. Check remaining slots for the role in this specific session.
  const socketsInRoom = await io.in(sessionRoom).fetchSockets();
  const currentCountInSession = socketsInRoom.filter(
    (sock) => sock.user && sock.user.role.toLowerCase() === userRole
  ).length;

  const remainingSlots = limits[userRole] - currentCountInSession;

  if (remainingSlots <= 0) {
    console.log(`[Backend] Denied ${userId} (${userRole}) from joining ${sessionRoom}: Role limit reached.`);
    return socket.emit("joinError", {
      message: `The session is already full for the '${currentUser.role}' role.`,
    });
  }

  try {
    // 5. Find all users busy in any session to exclude them from eligibility.
    const allSockets = await io.fetchSockets();
    const activeUserIdsInSessions = new Set();
    allSockets.forEach(sock => {
      if (sock.user) {
        const inASession = Array.from(sock.rooms).some(r => r.startsWith('session_'));
        if (inASession) {
          activeUserIdsInSessions.add(sock.user.id);
        }
      }
    });

    const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);

    // 6. Find the next eligible users for the remaining slots.
    const eligibleUsers = await knex("users")
      .select("id")
      .where({ organisation_id: currentUser.organisation_id })
      .whereRaw("LOWER(role) = ?", [userRole])
      .where("lastLogin", ">=", sixHoursAgo)
      .whereNotIn('id', Array.from(activeUserIdsInSessions))
      .orderBy("lastLogin", "asc")
      .limit(remainingSlots);

    const eligibleUserIds = eligibleUsers.map((user) => user.id);
    const isEligible = eligibleUserIds.includes(currentUser.id);

    if (isEligible) {
      socket.join(sessionRoom);
      console.log(`[Backend] User ${userId} (${currentUser.role}) is eligible and joined session: ${sessionRoom}`);
      socket.to(sessionRoom).emit("userJoined", { userId });
      socket.to(sessionRoom).emit("paticipantAdd", { userId, sessionData: sessionData || null });
      if (sessionData) {
        socket.emit("session:joined", sessionData);
      }
    } else {
      console.log(`[Backend] Denied ${userId} (${currentUser.role}) from joining ${sessionRoom}: Not eligible or not next in line.`);
      socket.emit("joinError", {
        message: `Session access is limited for the '${currentUser.role}' role. Please wait for an open slot.`,
      });
    }
  } catch (error) {
    console.error(`[Backend] Error during joinSession eligibility check: ${error.message}`);
    socket.emit("joinError", { message: "A server error occurred." });
  }
});

// ... rest of your code

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
        // Step 1: Create a map of { userId -> sessionRoom } for all connected users.
        // This is the most reliable way to know who is where.
        const userSessionMap = new Map();
        const allSockets = await io.fetchSockets();

        allSockets.forEach((sock) => {
          if (sock.user) {
            // Find the specific session room the socket is in.
            const room = Array.from(sock.rooms).find((r) =>
              r.startsWith("session_")
            );
            if (room) {
              userSessionMap.set(sock.user.id, room);
            }
          }
        });
        console.log("[Backend] User Session Map:", userSessionMap);

        // Step 2: Fetch all users from the organization database.
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

        // Step 3: Filter the org users based on the session map.
        const participants = allOrgUsers
          .filter((user) => {
            const usersCurrentSession = userSessionMap.get(user.id);

            // If the user is not in the map, they are not in ANY session.
            // Therefore, they are available. Keep them.
            if (!usersCurrentSession) {
              return true;
            }

            // If the user IS in a session, we only keep them if that session
            // is the one we are currently fetching the list for.
            return usersCurrentSession === sessionRoom;
          })
          .map((user) => ({
            id: user.id,
            name: `${user.fname} ${user.lname}`,
            uemail: user.uemail,
            role: user.role,
            // The 'inRoom' flag is true only if their session in the map matches the current session room.
            inRoom: userSessionMap.get(user.id) === sessionRoom,
          }));

        console.log(
          `[Backend] Sending participant list for ${sessionRoom} with ${participants.length} users.`
        );
        // Step 4: Send the final, correctly filtered list to the client.
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
