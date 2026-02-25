// backend/wardSocket.js
const Knex = require("knex");
const knexConfig = require("./knexfile").development;
const knex = Knex(knexConfig);

module.exports = (io) => {
  const wardIo = io.of("/ward");
  wardIo.use(async (socket, next) => {
    const username = socket.handshake.auth.username;
    if (username) {
      const user = await knex("users").where({ username }).first();
      if (user) {
        socket.user = user;
        socket.join(username);
        next();
      } else {
        next(new Error("User not found"));
      }
    } else {
      next(new Error("Ward Namespace: No username provided"));
    }
  });

  wardIo.on("connection", async (socket) => {
    console.log(`[Ward-Socket] 🟢 Connected: ${socket.user.username}`);

    await checkActiveWardSession(socket, wardIo, true);

    socket.on("join_active_session", async () => {
      console.log(
        `[Ward-Socket] 🔄 Joining active rooms for ${socket.user.username}`,
      );
      await checkActiveWardSession(socket, wardIo, true);
    });

    socket.on("trigger_patient_update", (data) => {
      const { sessionId, assignedRoom } = data;

      console.log(sessionId,"sessionIdsessionIdsessionId")
      if (!sessionId) {
        socket.emit("join_error", {
          message: "Session ID is required for patient update",
          code: "MISSING_SESSION_ID",
        });
        return;
      }

      console.log(`[Ward-Socket] 📡 Update Zone: ${assignedRoom || "Global"}`);

      socket
        .to(`ward_session_${sessionId}_supervisors`)
        .emit("patient_data_updated", {
          ...data,
          isRefresh: true,
          json: JSON.stringify(data),
        });

      if (assignedRoom && assignedRoom !== "all") {
        socket
          .to(`ward_session_${sessionId}_zone_${assignedRoom}`)
          .emit("patient_data_updated", {
            ...data,
            isRefresh: true,
            json: JSON.stringify(data),
          });
      } else {
        socket.to(`ward_session_${sessionId}`).emit("patient_data_updated", {
          ...data,
          isRefresh: true,
          json: JSON.stringify(data),
        });
      }
    });

    socket.on("end_ward_session_manual", async ({ sessionId }) => {
      if (!sessionId) {
        socket.emit("join_error", {
          message: "Session ID is required to end session",
          code: "MISSING_SESSION_ID",
        });
        return;
      }

      console.log(
        `[Ward-Socket] 🛑 Manual End: ${sessionId} by ${socket.user.username}`,
      );

      // Check if session exists before trying to end it
      const session = await knex("wardsession")
        .where({ id: sessionId })
        .first();
      if (!session) {
        socket.emit("join_error", {
          message: `Session ${sessionId} does not exist`,
          code: "SESSION_NOT_FOUND",
        });
        return;
      }

      await terminateSession(sessionId, wardIo, socket.user.username);
    });

    socket.on("getTime", () => {
      console.log(`[Ward-Sooooooooooooooooooooooooooooooooooocket]`);
      socket.emit(
        "get_ward_time",
        JSON.stringify({
          current_time: new Date(),
        }),
      );
    });

    socket.on("disconnect", () => {
      console.log(`[Ward-Socket] 🔴 Disconnected: ${socket.user.username}`);
    });
  });

  setInterval(async () => {
    try {
      const activeSessions = await knex("wardsession")
        .select("*")
        .where({ status: "ACTIVE" });

      const now = new Date().getTime();

      for (const session of activeSessions) {
        if (session.duration) {
          const startTime = new Date(session.start_time).getTime();
          const durationMs = session.duration * 60 * 1000;

          if (now > startTime + durationMs + 5000) {
            await terminateSession(session.id, wardIo, "auto");
          }
        }
      }
    } catch (e) {
      console.error("[Ward-Socket] Auto-expiry check failed:", e);
    }
  }, 60000);

  return wardIo;
};

async function checkActiveWardSession(socket, namespaceIo, shouldEmit = true) {
  try {
    const userId = socket.user.id;
    const userRole = socket.user.role.toLowerCase();
    const userIdStr = String(userId);

    const activeSessions = await knex("wardsession")
      .select("*")
      .where({ status: "ACTIVE" });

    if (activeSessions.length === 0) {
      if (shouldEmit) {
        socket.emit("join_error", {
          message: "No active ward sessions found",
          code: "NO_ACTIVE_SESSIONS",
          isInfo: true,
        });
      }
      return;
    }

    let joinedAnySession = false;

    for (const session of activeSessions) {
      let assignments = session.assignments;
      if (typeof assignments === "string") {
        try {
          assignments = JSON.parse(assignments);
        } catch (e) {
          console.error(
            `[Ward-Socket] Failed to parse assignments for session ${session.id}:`,
            e,
          );
          continue; // Skip this session if assignments are corrupted
        }
      }

      let myZone = null;
      let isSupervisor = false;

      const assignedFaculty = assignments.faculty || [];
      const assignedObservers =
        assignments.Observer || assignments.observer || [];

      const isAssignedFaculty =
        Array.isArray(assignedFaculty) &&
        assignedFaculty.some((id) => String(id) === userIdStr);
      const isAssignedObserver =
        Array.isArray(assignedObservers) &&
        assignedObservers.some((id) => String(id) === userIdStr);
      const isCreator = String(session.started_by) === userIdStr;

      if (isAssignedFaculty || isAssignedObserver || isCreator) {
        isSupervisor = true;
      }

      if (!isSupervisor) {
        const zoneSource = assignments.zones || assignments;
        if (zoneSource && typeof zoneSource === "object") {
          for (const [key, val] of Object.entries(zoneSource)) {
            const targetId = val.userId || (val.user && val.user.id);
            if (targetId && String(targetId) == userIdStr) {
              myZone = key.replace("zone", "");
              break;
            }
          }
        }
      }

      if (isSupervisor || myZone) {
        joinedAnySession = true;
        const baseRoom = `ward_session_${session.id}`;

        socket.join(baseRoom);

        if (isSupervisor) {
          const supervisorRoom = `${baseRoom}_supervisors`;
          socket.join(supervisorRoom);
        }

        if (myZone) {
          const zoneRoom = `${baseRoom}_zone_${myZone}`;
          socket.join(zoneRoom);
        }

        if (shouldEmit) {
          const now = Date.now();
          const lastEmit = socket.lastSessionEmitTime || 0;

          if (now - lastEmit < 2000) {
            return;
          }

          socket.lastSessionEmitTime = now;

          const wardSessionData = await knex("wardsession")
            .where({ id: session.id })
            .first();

          if (!wardSessionData) {
            console.error(
              `[Ward-Socket] Session ${session.id} not found in database`,
            );
            continue;
          }

          const startTime = new Date(wardSessionData.start_time);
          const durationMinutes = Number(session.duration);
          const endTime = new Date(
            startTime.getTime() + durationMinutes * 60 * 1000,
          );

          const currentTime = new Date();

          const sessionData = {
            sessionId: session.id,
            wardId: session.ward_id,
            assignedRoom: myZone || "all",
            startedBy: session.started_by,
            startedByRole: "admin",
            start_time: startTime,
            end_time: endTime,
            duration: session.duration,
            current_time: currentTime,
          };

          const jsonData = {
            sessionId: session.id,
            wardId: session.ward_id,
            assignedRoom: myZone || "all",
            startedBy: session.started_by,
            startedByRole: "admin",
            userId: userId,
          };

          socket.emit("start_ward_session", {
            ...sessionData,
            json: JSON.stringify(jsonData),
          });
        }
      }
    }

    // If user wasn't assigned to any active session
    if (!joinedAnySession && shouldEmit) {
      socket.emit("join_error", {
        message: "You are not assigned to any active ward session",
        code: "NOT_ASSIGNED_TO_SESSION",
        userId: userId,
      });
    }
  } catch (error) {
    console.error("[Ward-Socket] Check Active Session Error:", error);
    if (shouldEmit) {
      socket.emit("join_error", {
        message: "Server error while checking active sessions",
        error: error.message || "Unknown error",
        code: "INTERNAL_ERROR",
      });
    }
  }
}

async function terminateSession(sessionId, wardIo, endedBy) {
  try {
    // First check if session exists
    const session = await knex("wardsession").where({ id: sessionId }).first();

    if (!session) {
      console.error(
        `[Ward-Socket] Cannot terminate: Session ${sessionId} not found`,
      );
      wardIo.emit("join_error", {
        message: `Session ${sessionId} not found`,
        code: "SESSION_NOT_FOUND",
        sessionId: sessionId,
      });
      return false;
    }

    let endedByValue;

    if (endedBy === "auto") {
      endedByValue = "auto";
    } else {
      const user = await knex("users").where({ username: endedBy }).first();
      endedByValue = user ? user.id : "unknown";
    }

    const updated = await knex("wardsession").where({ id: sessionId }).update({
      status: "COMPLETED",
      endedBy: endedByValue,
      ended_at: knex.fn.now(),
    });

    if (!updated) {
      throw new Error(`Session ${sessionId} not found or already completed`);
    }

    wardIo
      .to(`ward_session_${sessionId}`)
      .emit("end_ward_session", { sessionId, endedBy: endedByValue });

    console.log(
      `[Ward-Socket] ✅ Session ${sessionId} terminated by ${endedByValue}`,
    );
    return true;
  } catch (err) {
    console.error("[Ward-Socket] Error terminating session:", err);
    wardIo.emit("join_error", {
      message: `Failed to terminate session ${sessionId}`,
      error: err.message,
      code: "TERMINATION_FAILED",
      sessionId: sessionId,
    });
    return false;
  }
}
