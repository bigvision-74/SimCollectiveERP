const socketIO = require("socket.io");
const Knex = require("knex");
const { name } = require("ejs");
const knexConfig = require("./knexfile").development;
const knex = Knex(knexConfig);
const { secondaryApp } = require("./firebase");
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

  io.use(async (socket, next) => {
    const auth = socket.handshake.auth;
    const headers = socket.handshake.headers;

    const emailInput = auth.userEmail || headers["x-user-email"];
    const usernameInput = auth.username || headers["x-username"];

    console.log(
      `[Auth] 🔌 Connection attempt. Email: ${emailInput || "N/A"}, Username: ${
        usernameInput || "N/A"
      }`
    );

    if (!emailInput && !usernameInput) {
      console.error("[Auth] ❌ FAILED: Neither email nor username provided.");
      return next(new Error("Authentication error: No credentials provided"));
    }

    try {
      let user = null;
      if (emailInput) {
        user = await knex("users").where({ uemail: emailInput }).first();
      }

      if (!user && usernameInput) {
        user = await knex("users").where({ username: usernameInput }).first();
      }

      if (!user) {
        console.error(`[Auth] ❌ FAILED: User not found.`);
        return next(new Error("Authentication error: User not found"));
      }

      console.log(`[Auth] ✅ SUCCESS: User ${user.id} authenticated.`);

      socket.user = user;

      if (user.uemail) {
        socket.join(user.uemail);
        console.log(`[Auth] Joined Email Room: ${user.uemail}`);
      }

      if (user.username) {
        socket.join(user.username);
        console.log(`[Auth] Joined Username Room: ${user.username}`);
      }

      next();
    } catch (error) {
      console.error("[Auth] ❌ Database error:", error);
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
    });

    socket.on("video:selected", (data) => {
      const room = `session-${data.sessionId}-patient-${data.patientId}`;
      socket.to(room).emit("video:selected", data);
    });

    socket.on("vrSessionDetails", (data) => {
      const { sessionId, patientId, userId } = data;
      if (!sessionUserMap[sessionId]) sessionUserMap[sessionId] = {};
      if (!sessionUserMap[sessionId][patientId])
        sessionUserMap[sessionId][patientId] = new Set();

      sessionUserMap[sessionId][patientId].add(userId);

      const userCount = sessionUserMap[sessionId][patientId].size;

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

      console.log(sessionId, userId, sessionData,"sessionId, userId, sessionData")
      try {
        const session = await knex("session").where({ id: sessionId }).first();

        if (!session) {
          return socket.emit("joinError", { message: "Session not found." });
        }

        if (session.state && session.state.toLowerCase() === "ended") {
          return socket.emit("joinError", {
            message: "This session has already ended and cannot be joined.",
          });
        }

        if (session.startTime && session.duration) {
          const startTime = new Date(session.startTime);
          const endTime = new Date(
            startTime.getTime() + session.duration * 60000
          );
          const now = new Date();

          if (now > endTime) {
            return socket.emit("joinError", {
              message: "This session has already ended and cannot be joined.",
            });
          }
        }

        const sessionRoom = `session_${sessionId}`;
        const currentUser = socket.user;
        // const userRole = currentUser.role.toLowerCase(); // Role check no longer primary filter

        const currentRooms = Array.from(socket.rooms);
        const inAnotherSession = currentRooms.some(
          (room) => room.startsWith("session_") && room !== sessionRoom
        );

        if (inAnotherSession) {
          return socket.emit("joinError", {
            message: "You are already participating in another session.",
          });
        }

        // --- NEW JOIN LOGIC: ID Based Check ---

        let isEligible = false;
        let participantsInDb = [];

        // Parse the allowed list from DB
        if (session.participants) {
          try {
            participantsInDb = Array.isArray(session.participants)
              ? session.participants
              : JSON.parse(session.participants);
          } catch (e) {
            console.error(
              `Error parsing participants for session ${sessionId}`,
              e
            );
            participantsInDb = [];
          }
        }

        // 1. Check if user is explicitly in the participants list
        const isAssigned = participantsInDb.some(
          (p) => String(p.id) === String(currentUser.id)
        );

        // 2. Check if user is the creator
        const isCreator = String(currentUser.id) === String(session.createdBy);

        // 3. Admin Override (Always allow Admin of the org)
        const isAdmin =
          currentUser.role === "Admin" &&
          currentUser.organisation_id === socket.user.organisation_id;

        if (isAssigned || isCreator || isAdmin) {
          isEligible = true;
        }

        if (isEligible) {
          socket.join(sessionRoom);
          socket.currentSessionId = sessionId;

          try {
            await knex.transaction(async (trx) => {
              // Re-fetch to lock
              const lockedSession = await trx("session")
                .where({ id: sessionId })
                .forUpdate()
                .first();

              let currentParticipants = [];
              if (lockedSession.participants) {
                try {
                  currentParticipants = Array.isArray(
                    lockedSession.participants
                  )
                    ? lockedSession.participants
                    : JSON.parse(lockedSession.participants);
                } catch (e) {
                  currentParticipants = [];
                }
              }

              const newParticipantData = {
                id: currentUser.id,
                name: `${currentUser.fname} ${currentUser.lname}`,
                uemail: currentUser.uemail,
                role: currentUser.role,
                inRoom: true, // Mark as active
              };

              const existingIndex = currentParticipants.findIndex(
                (p) => String(p.id) === String(currentUser.id)
              );

              if (existingIndex > -1) {
                // Update existing entry
                currentParticipants[existingIndex] = {
                  ...currentParticipants[existingIndex],
                  ...newParticipantData,
                };
              } else {
                // If Admin joins late and wasn't in list (unlikely due to createSession logic, but possible), add them.
                currentParticipants.push(newParticipantData);
              }

              await trx("session")
                .where({ id: sessionId })
                .update({ participants: JSON.stringify(currentParticipants) });

              // Emit updates
              io.to(sessionRoom).emit("participantListUpdate", {
                participants: currentParticipants,
              });
              socket.to(sessionRoom).emit("userJoined", { userId });

              if (sessionData) {
                socket.emit("session:joined", sessionData);
              } else {
                // Construct payload if joining via rejoin/url
                const sessionDetails = await knex("session as s")
                  .select(
                    "s.startTime",
                    "s.duration",
                    knex.raw(
                      "DATE_ADD(s.startTime, INTERVAL s.duration MINUTE) as end_time"
                    ),
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
                      sessionId: sessionId,
                      patientId: session.patient, // Ensure patientId is sent
                      startTime: sessionDetails.startTime,
                      end_time: sessionDetails.end_time,
                      duration: sessionDetails.duration,
                      current_time: sessionDetails.current_time,
                    },
                  ],
                };
                socket.emit("session:joined", payload); // Removed JSON.stringify to match frontend expectation if it expects object
              }
            });
          } catch (error) {
            console.error(
              `Transaction error joining session ${sessionId}:`,
              error
            );
            socket.emit("joinError", {
              message: "Server error joining session.",
            });
          }
        } else {
          // Specific error for non-invited users
          socket.emit("joinError", {
            message: "You are not assigned to this session.",
          });
        }
      } catch (error) {
        console.error(`Error in joinSession ${sessionId}:`, error);
        socket.emit("joinError", { message: "Critical server error." });
      }
    });

    socket.on("getParticipantList", async ({ sessionId }) => {
      if (!sessionId) {
        return;
      }

      try {
        const session = await knex("session").where({ id: sessionId }).first();

        if (!session) {
          return socket.emit("participantListError", {
            message: "Session not found.",
          });
        }

        let participants = [];
        if (session.participants) {
          try {
            participants = Array.isArray(session.participants)
              ? session.participants
              : JSON.parse(session.participants);
          } catch (e) {
            console.error(
              `[Backend] Error parsing participants JSON for session ${sessionId}.`,
              e
            );
            return socket.emit("participantListError", {
              message: "Could not retrieve participant list.",
            });
          }
        }

        const sessionRoom = `session_${sessionId}`;
        const socketsInRoom = await io.in(sessionRoom).fetchSockets();
        const connectedUserIds = new Set(
          socketsInRoom.map((sock) => sock.user.id)
        );

        const enrichedParticipants = participants.map((p) => ({
          ...p,
          inRoom: connectedUserIds.has(p.id),
        }));

        socket.emit("participantListUpdate", {
          participants: enrichedParticipants,
        });
      } catch (error) {
        console.error(
          `[Backend] Error fetching participant list for session_${sessionId}:`,
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

      if (typeof sessionId !== "string" && typeof sessionId !== "number") {
        console.error(
          `Received refreshPatientData with invalid sessionId type: ${typeof sessionId}`
        );
        return;
      }

      let parsedSession =
        typeof sessionId === "string" ? JSON.parse(sessionId) : sessionId;
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
        message: "Session Ended",
      };
      io.to(sessionRoom).emit("session:ended", payload);
      io.emit("session:endedApp", sessionId);
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

        const obs =
          section == "observations" && isVisible == true ? "show" : "hide";
        const cln =
          section == "patientAssessment" && isVisible == true ? "show" : "hide";
        const tre =
          section == "diagnosisAndTreatment" && isVisible == true
            ? "show"
            : "hide";

        const data = {
          device_type: "App",
          patient_summary_clinicalInformation: cln,
          patient_summary_observations: obs,
          patient_summary_diagnosisAndTreatment: tre,
        };

        socket
          .to(sessionRoom)
          .emit("session:visibility-change", JSON.stringify(data, null, 2));
      }
    );

    socket.on("disconnect", async () => {
      const sessionId = socket.currentSessionId;

      if (!sessionId) {
        console.log(
          `[Disconnect] Socket ${socket.id} was not in a session room. No participant update needed.`
        );
        return;
      }

      const userId = socket.user?.id;

      if (!userId) {
        console.error(
          `[Disconnect] CRITICAL: Could not identify user ID for disconnected socket ${socket.id}.`
        );
        return;
      }

      const sessionRoom = `session_${sessionId}`;
      console.log(
        `[Disconnect] User ${userId} disconnecting from session ${sessionId}...`
      );

      try {
        const session = await knex("session").where({ id: sessionId }).first();

        if (!session || !session.participants) {
          console.log(
            `[Disconnect] Session ${sessionId} not found or has no participants. No update needed.`
          );
          return;
        }

        let participants = [];
        try {
          participants = Array.isArray(session.participants)
            ? session.participants
            : JSON.parse(session.participants);
        } catch (e) {
          console.error(
            `[Disconnect] Failed to parse participants JSON for session ${sessionId}.`,
            e
          );
          return;
        }

        let participantUpdated = false;
        const updatedParticipants = participants.map((p) => {
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

          console.log(
            `[Disconnect] Set inRoom=false for user ${userId} in session ${sessionId}.`
          );

          io.to(sessionRoom).emit("participantListUpdate", {
            participants: updatedParticipants,
          });
        } else {
          console.log(
            `[Disconnect] User ${userId} was not found in the participant list for session ${sessionId}.`
          );
        }
      } catch (error) {
        console.error(
          `[Disconnect] ❌ Error updating participant status on disconnect for session ${sessionId}:`,
          error
        );
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
