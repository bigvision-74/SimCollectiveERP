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
      console.log(
        `[joinSession] 📥 Received 'joinSession' event from User ID: ${userId} for Session ID: ${sessionId}`
      );
      // Log sessionData presence for easier debugging
      console.log("[joinSession] Payload:", { sessionId, userId, sessionData: sessionData ? "Present" : "Not Present" });

      try {
        const session = await knex("session").where({ id: sessionId }).first();

        if (!session) {
          console.error(`[joinSession] DENIED: Session with ID ${sessionId} not found in database.`);
          return socket.emit("joinError", { message: "Session not found." });
        }

        if (session.state && session.state.toLowerCase() === 'ended') {
          console.log(`[joinSession] DENIED: User ${userId} attempted to join an ended session ${sessionId}.`);
          return socket.emit("joinError", {
            message: "This session has already ended and cannot be joined.",
          });
        }

        if (session.startTime && session.duration) {
          const startTime = new Date(session.startTime);
          const endTime = new Date(startTime.getTime() + session.duration * 60000); // duration is in minutes
          const now = new Date();

          if (now > endTime) {
            console.log(`[joinSession] DENIED: User ${userId} attempted to join a session ${sessionId} that has already finished.`);
            return socket.emit("joinError", {
              message: "This session has already ended and cannot be joined.",
            });
          }
        }

        const sessionRoom = `session_${sessionId}`;
        const currentUser = socket.user;
        const userRole = currentUser.role.toLowerCase();

        console.log(`[joinSession] User Role identified as: '${userRole}'`);

        const currentRooms = Array.from(socket.rooms);
        const inAnotherSession = currentRooms.some(
          (room) => room.startsWith("session_") && room !== sessionRoom
        );

        if (inAnotherSession) {
          console.log(`[joinSession] DENIED: User ${userId} is already in another session.`);
          return socket.emit("joinError", {
            message: "You are already participating in another session.",
          });
        }

        let isEligible = false;
        // Priveleged users (admins, session starters) get instant access
        if (sessionData && sessionData.startedBy && currentUser.id == sessionData.startedBy) {
          isEligible = true;
        } else if (userRole === "admin") {
          isEligible = true;
        } else {
          // Role-based eligibility logic starts here
          const limits = { user: 3, observer: 1, faculty: 1 };

          // If a role has no defined limit, they are eligible.
          if (!limits.hasOwnProperty(userRole)) {
            isEligible = true;
          } else {
            const socketsInRoom = await io.in(sessionRoom).fetchSockets();
            const currentCountInSession = socketsInRoom.filter(
              (sock) => sock.user && sock.user.role.toLowerCase() === userRole
            ).length;
            const remainingSlots = limits[userRole] - currentCountInSession;

            if (remainingSlots <= 0) {
              console.log(`[joinSession] DENIED: Session is full for role '${userRole}'.`);
              return socket.emit("joinError", {
                message: `The session is already full for the '${currentUser.role}' role.`,
              });
            }

            // --- NEW LOGIC FORK ---
            // If the user is joining without sessionData (e.g., direct link),
            // and we've already confirmed there's a slot, they are eligible immediately.
            if (!sessionData) {
              console.log(`[joinSession] No sessionData present. Granting eligibility for User ${userId} based on available slots.`);
              isEligible = true;
            } else {
              // If sessionData IS present, use the original, stricter "next in line" logic.
              console.log(`[joinSession] sessionData is present. Applying strict 'next-in-line' eligibility check for User ${userId}.`);
              const allSockets = await io.fetchSockets();
              const activeUserIdsInSessions = new Set();
              allSockets.forEach((sock) => {
                if (sock.user) {
                  const inASession = Array.from(sock.rooms).some((r) => r.startsWith("session_"));
                  if (inASession) activeUserIdsInSessions.add(sock.user.id);
                }
              });

              const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
              const eligibleUsers = await knex("users")
                .select("id")
                .where({ organisation_id: socket.user.organisation_id })
                .whereRaw("LOWER(role) = ?", [userRole])
                .where("lastLogin", ">=", sixHoursAgo)
                .whereNotIn("id", Array.from(activeUserIdsInSessions))
                .orderBy("lastLogin", "asc")
                .limit(remainingSlots);

              const eligibleUserIds = eligibleUsers.map((user) => user.id);
              isEligible = eligibleUserIds.includes(currentUser.id);
            }
          }
        }

        if (isEligible) {
          socket.join(sessionRoom);
          socket.currentSessionId = sessionId;
          console.log(`[joinSession] SUCCESS: Eligible user ${userId} (${userRole}) joined ${sessionRoom}.`);

          let participants = [];
          if (session.participants) {
            try {
              participants = Array.isArray(session.participants) ? session.participants : JSON.parse(session.participants);
            } catch (e) {
              console.error(`[joinSession] Error parsing participants JSON for session ${sessionId}. Resetting list.`, e);
              participants = [];
            }
          }

          const newParticipant = {
            id: currentUser.id,
            name: `${currentUser.fname} ${currentUser.lname}`,
            uemail: currentUser.uemail,
            role: currentUser.role,
            inRoom: true,
          };

          const existingParticipantIndex = participants.findIndex(p => p.id === currentUser.id);
          if (existingParticipantIndex > -1) {
            participants[existingParticipantIndex] = newParticipant;
          } else {
            participants.push(newParticipant);
          }

          await knex("session").where({ id: sessionId }).update({ participants: JSON.stringify(participants) });
          console.log(`[joinSession] Updated participants list for session ${sessionId}.`);

          io.to(sessionRoom).emit("participantListUpdate", { participants });
          socket.to(sessionRoom).emit("userJoined", { userId });

          if (sessionData) {
            socket.emit("session:joined", sessionData);
          } else {
            const sessionDetails = await knex("session as s")
              .select(
                "s.startTime",
                "s.duration",
                knex.raw("DATE_ADD(s.startTime, INTERVAL s.duration MINUTE) as end_time"),
                knex.raw("NOW() as `current_time`")
              )
              .where("s.id", sessionId)
              .first();

            const payload = {
              success: true,
              message: "Active sessions fetched successfully",
              data: [
                {
                  userId: userId,
                  startTime: sessionDetails.startTime,
                  end_time: sessionDetails.end_time,
                  duration: sessionDetails.duration,
                  current_time: sessionDetails.current_time,
                },
              ],
            };

            socket.emit("session:joined", JSON.stringify(payload));
          }

        } else {
          console.log(`[joinSession] DENIED: User ${userId} is not eligible or not next in line.`);
          socket.emit("joinError", {
            message: `Session access is limited for the '${currentUser.role}' role. Please wait for an open slot.`,
          });
        }
      } catch (error) {
        console.error(`[joinSession] ❌ CRITICAL ERROR in joinSession for session ${sessionId}:`, error);
        socket.emit("joinError", {
          message: "A critical server error occurred while trying to join the session.",
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

    socket.on("refreshPatientData", async (sessionId) => {
      if (!sessionId) {
        console.error("Received refreshPatientData event with no sessionId.");
        return;
      }

      if (typeof sessionId !== 'string' && typeof sessionId !== 'number') {
        console.error(`Received refreshPatientData with invalid sessionId type: ${typeof sessionId}`);
        return;
      }

      let parsedSession = typeof sessionId === "string" ? JSON.parse(sessionId) : sessionId;
      let sid = parsedSession.sessionId;
      const patient = await knex("session").where({ id: sid }).first();
      const roomName = `patient_${patient.patient}`;
      io.to(roomName).emit("refreshPatientData");

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
        console.log(section, isVisible)
        socket
          .to(sessionRoom)
          .emit("session:visibility-changed", { section, isVisible });

        const obs = section == 'observations' && isVisible == true ? "show" : "hide"
        const cln = section == 'patientAssessment' && isVisible == true ? "show" : "hide"
        const tre = section == 'diagnosisAndTreatment' && isVisible == true ? "show" : "hide"

        const data = {
          "device_type": "App",
          "patient_summary_clinicalInformation": cln,
          "patient_summary_observations": obs,
          "patient_summary_diagnosisAndTreatment": tre
        }

        socket
          .to(sessionRoom)
          .emit("session:visibility-change", JSON.stringify(data, null, 2));
      }
    );

    socket.on("disconnect", async () => {
      console.log(`[Backend] Client disconnected: ${socket.id}`);

      const sessionId = socket.currentSessionId;

      if (!sessionId) {
        // THIS IS THE NEW LOGGING STATEMENT
        console.log(`[Disconnect] Socket ${socket.id} was not in a session room. No participant update needed.`);
        return;
      }


      const userId = socket.user?.id;

      if (!userId) {
        console.error(`[Disconnect] CRITICAL: Could not identify user ID for disconnected socket ${socket.id}.`);
        return;
      }

      console.log(`[Disconnect] User ${userId} disconnecting from session ${sessionId}...`);

      try {
        const session = await knex("session").where({ id: sessionId }).first();

        if (!session || !session.participants) {
          console.log(`[Disconnect] Session ${sessionId} not found or has no participants. No update needed.`);
          return; // Session ended or has no participants list.
        }

        let participants = [];
        try {
          participants = Array.isArray(session.participants) ? session.participants : JSON.parse(session.participants);
        } catch (e) {
          console.error(`[Disconnect] Failed to parse participants JSON for session ${sessionId}.`, e);
          return; // Can't proceed if JSON is corrupted
        }

        let participantUpdated = false;
        const updatedParticipants = participants.map(p => {
          // Find the disconnected user and set their inRoom status to false
          if (p.id == userId) {
            p.inRoom = false;
            participantUpdated = true;
          }
          return p;
        });

        if (participantUpdated) {
          await knex("session")
            .where({ id: sessionId })
            .update({ participants: JSON.stringify(updatedParticipants) });

          console.log(`[Disconnect] Set inRoom=false for user ${userId} in session ${sessionId}.`);

          io.to(sessionRoom).emit("participantListUpdate", { participants: updatedParticipants });
        } else {
          console.log(`[Disconnect] User ${userId} was not found in the participant list for session ${sessionId}.`);
        }
      } catch (error) {
        console.error(`[Disconnect] ❌ Error updating participant status on disconnect for session ${sessionId}:`, error);
      }
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
