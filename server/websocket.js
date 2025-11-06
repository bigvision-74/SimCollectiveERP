const socketIO = require("socket.io");
const Knex = require("knex");
const { name } = require("ejs");
const knexConfig = require("./knexfile").development;
const knex = Knex(knexConfig);
const { secondaryApp } = require('./firebase');
let io;

const initWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "https://inpatientsim.com",
        "https://www.inpatientsim.com",
        "https://simvpr.com",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  // initMediaSocketClient(io);

  io.use(async (socket, next) => {
    // Get userEmail from the auth object OR a custom header
    const userEmail = socket.handshake.auth.userEmail || socket.handshake.headers['x-user-email'];

    console.log(
      `[Auth] 🔌 New connection attempt from socket ${socket.id}. Attempting to authenticate...`
    );

    if (!userEmail) {
      console.error(
        "[Auth] ❌ FAILED: No userEmail provided in socket.handshake.auth or x-user-email header."
      );
      return next(new Error("Authentication error: User email not provided"));
    }

    console.log(`[Auth] ✉️ Email received: ${userEmail}`);

    try {
      const user = await knex("users").where({ uemail: userEmail }).first();
      if (!user) {
        console.error(
          `[Auth] ❌ FAILED: User not found in database for email: ${userEmail}`
        );
        return next(new Error("Authentication error: User not found"));
      }

      console.log(
        `[Auth] ✅ SUCCESS: User ${user.id} (${user.uemail}) authenticated successfully.`
      );
      socket.user = user; // Attach user to the socket
      socket.join(userEmail); // Join a room for direct messaging if needed
      next(); // Proceed to the 'connection' event
    } catch (error) {
      console.error(
        "[Auth] ❌ FAILED: Database error during authentication.",
        error
      );
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const orgRoom = `org_${socket.user.organisation_id}`;
    socket.join(orgRoom);

    socket.on("session:rejoin", ({ sessionId }) => {
      if (!sessionId) {
        console.log(
          "[Backend] Received session:rejoin event with no sessionId."
        );
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      socket.join(sessionRoom);
      socket.emit("session:rejoined", {
        message: `Successfully rejoined room ${sessionRoom}`,
      });
    });

    socket.on("joinVrSession", ({ sessionId, patientId }) => {
      const room = `session-${sessionId}-patient-${patientId}`;
      socket.join(room);
      console.log(`✅ Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("video:selected", (data) => {
      const room = `session-${data.sessionId}-patient-${data.patientId}`;
      console.log("🎬 Web selected media:", data);

      // Broadcast to all VR clients in the same room
      socket.to(room).emit("video:selected", data);
    });

    // VR client can emit status updates back to web
    socket.on("vrSessionDetails", (data) => {
      const { sessionId, patientId, userId } = data;
      console.log(sessionId, "sessionId");
      console.log(patientId, "patientId");
      console.log(userId, "userId");
      if (!sessionUserMap[sessionId]) sessionUserMap[sessionId] = {};
      if (!sessionUserMap[sessionId][patientId])
        sessionUserMap[sessionId][patientId] = new Set();

      // Add this user
      sessionUserMap[sessionId][patientId].add(userId);

      // Count the total users for this session and patient
      const userCount = sessionUserMap[sessionId][patientId].size;

      console.log(
        `Session: ${sessionId}, Patient: ${patientId}, Users: ${userCount}`
      );

      // Broadcast to all clients in this session & patient room
      io.to(`session-${sessionId}-patient-${patientId}`).emit(
        "vrSessionDetails",
        {
          sessionId,
          patientId,
          userCount,
        }
      );
    });

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
      // --- Existing Log (Good) ---
      console.log(
        `[joinSession] 📥 Received 'joinSession' event from User ID: ${userId} for Session ID: ${sessionId}`
      );
      console.log("[joinSession] Payload:", { sessionId, userId, sessionData });

      // --- Wrap EVERYTHING in a try...catch block ---
      try {
        const sessionRoom = `session_${sessionId}`;
        const currentUser = socket.user;
        const userRole = currentUser.role.toLowerCase();

        console.log(`[joinSession] User Role identified as: '${userRole}'`);

        const currentRooms = Array.from(socket.rooms);
        const inAnotherSession = currentRooms.some(
          (room) => room.startsWith("session_") && room !== sessionRoom
        );

        if (inAnotherSession) {
          console.log(
            `[joinSession]  DENIED: User ${userId} is already in another session.`
          );
          return socket.emit("joinError", {
            message: "You are already participating in another session.",
          });
        }

        // (Creator and Admin checks remain the same...)
        if (
          sessionData &&
          sessionData.startedBy &&
          currentUser.id == sessionData.startedBy
        ) {
          socket.join(sessionRoom);
          console.log(
            `[joinSession] SUCCESS: User ${userId} (creator) joined ${sessionRoom}.`
          );
          socket.to(sessionRoom).emit("userJoined", { userId });
          socket.to(sessionRoom).emit("paticipantAdd", { userId, sessionData });
          socket.emit("session:joined", sessionData);
          return;
        }

        if (userRole === "admin") {
          socket.join(sessionRoom);
          console.log(
            `[joinSession] SUCCESS: User ${userId} (admin) joined ${sessionRoom}.`
          );
          socket.to(sessionRoom).emit("userJoined", { userId });
          if (sessionData) {
            socket.emit("session:joined", sessionData);
          }
          return;
        }

        const limits = { user: 3, observer: 1, faculty: 1 };
        if (!limits.hasOwnProperty(userRole)) {
          socket.join(sessionRoom);
          console.log(
            `[joinSession] SUCCESS: User ${userId} (unlimited role '${userRole}') joined ${sessionRoom}.`
          );
          socket.to(sessionRoom).emit("userJoined", { userId });
          if (sessionData) {
            socket.emit("session:joined", sessionData);
          }
          return;
        }

        // --- ADDING LOGS AROUND THE POTENTIAL FAILURE POINT ---
        console.log(
          `[joinSession] Checking participant count in room: ${sessionRoom}`
        );
        const socketsInRoom = await io.in(sessionRoom).fetchSockets();
        console.log(
          `[joinSession] Found ${socketsInRoom.length} sockets currently in the room.`
        );

        const currentCountInSession = socketsInRoom.filter(
          (sock) => sock.user && sock.user.role.toLowerCase() === userRole
        ).length;
        console.log(
          `[joinSession] Current count for role '${userRole}' is ${currentCountInSession}. Limit is ${limits[userRole]}.`
        );

        const remainingSlots = limits[userRole] - currentCountInSession;
        if (remainingSlots <= 0) {
          console.log(
            `[joinSession] DENIED: Session is full for role '${userRole}'.`
          );
          return socket.emit("joinError", {
            message: `The session is already full for the '${currentUser.role}' role.`,
          });
        }

        // The eligibility check block...
        console.log(
          "[joinSession] Checking user eligibility and queue position..."
        );
        const allSockets = await io.fetchSockets();

        console.log(allSockets,"allSocketsallSockets")
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

        console.log(socket.user.organisation_id, "socket.user.organisation_id")
        console.log(activeUserIdsInSessions, "activeUserIdsInSessions")
        console.log(sixHoursAgo, "sixHoursAgo")

        const eligibleUsers = await knex("users")
          .select("id")
          .where({ organisation_id: socket.user.organisation_id })
          .whereRaw("LOWER(role) = ?", [userRole])
          .where("lastLogin", ">=", sixHoursAgo)
          .whereNotIn("id", Array.from(activeUserIdsInSessions))
          .orderBy("lastLogin", "asc")
          .limit(remainingSlots);

        const eligibleUserIds = eligibleUsers.map((user) => user.id);
        const isEligible = eligibleUserIds.includes(currentUser.id);
        console.log(
          `[joinSession] Is user ${userId} eligible? ${isEligible}. Eligible IDs: [${eligibleUserIds.join(
            ", "
          )}]`
        );

        if (isEligible) {
          socket.join(sessionRoom);
          console.log(
            `[joinSession] SUCCESS: Eligible user ${userId} joined ${sessionRoom}.`
          );
          socket.to(sessionRoom).emit("userJoined", { userId });
          socket.to(sessionRoom).emit("paticipantAdd", {
            userId,
            sessionData: sessionData || null,
          });

          if (sessionData) {
            socket.emit("session:joined", sessionData);
          } else {
            socket.emit("session:joined", userId);
            const sessionDetails = await knex("session")
              .where({ id: sessionId }).first();
            const user = await knex("users").where({
              id: userId,
            }).first();

            const token = user.fcm_token;
            if (!token || typeof token !== 'string' || token.trim() === '') {
              console.log(`- No valid FCM token for user ${user.id}. Skipping notification.`);
              return; // Exit the block
            }

            const message = {
              notification: {
                title: "Session Started",
                body: `A new session started for patient ${sessionDetails.patient}.`,
              },
              token,
              data: {
                sessionId: sessionId,
                patientId: String(sessionDetails.patient),
              },
            };

            try {
              const response = await secondaryApp.messaging().send(message);
              console.log(
                `✅ session Notification sent to user ${user.id}:`,
                response.successCount
              );

              const failedTokens = [];
              response.responses.forEach((r, i) => {
                if (!r.success) {
                  failedTokens.push(token);
                }
              });

              if (failedTokens.length > 0) {
                const validTokens = token.filter(
                  (t) => !failedTokens.includes(t)
                );
                await knex("users")
                  .where({ id: user.id })
                  .update({ fcm_tokens: JSON.stringify(validTokens) });
                console.log(
                  `Removed invalid FCM tokens for user ${user.id}:`,
                  failedTokens
                );
              }
            } catch (notifErr) {
              console.error(
                `❌ Error sending FCM notification to user ${user.id}:`,
                notifErr
              );
            }
          }
        } else {
          console.log(
            `[joinSession] DENIED: User ${userId} is not eligible or not next in line.`
          );
          socket.emit("joinError", {
            message: `Session access is limited for the '${currentUser.role}' role. Please wait for an open slot.`,
          });
        }
      } catch (error) {
        // --- THIS WILL CATCH THE ERROR THAT WAS PREVIOUSLY SILENT ---
        console.error(
          `[joinSession] ❌ CRITICAL ERROR in joinSession for session ${sessionId}:`,
          error
        );
        socket.emit("joinError", {
          message:
            "A critical server error occurred while trying to join the session.",
        });
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
        console.log(targetSocket,"hhhhhhhhhhhhhhhh")

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
      const payload = {
        sessionId: sessionId,
        message: "Session Ended"
      };
      io.to(sessionRoom).emit("session:ended", payload);
      // io.emit("session:ended", sessionId);

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
