// backend/wardSocket.js
const Knex = require("knex");
const knexConfig = require("./knexfile").development;
const knex = Knex(knexConfig);

module.exports = (io) => {
  const wardIo = io.of("/ward");

  // Middleware: Authenticate and join Personal Room (username)
  wardIo.use(async (socket, next) => {
    const username = socket.handshake.auth.username;
    if (username) {
      const user = await knex("users").where({ username }).first();
      if (user) {
        socket.user = user;
        socket.join(username); // Required for API controller broadcasts
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

    // 1. On Refresh: Join rooms AND emit 'start_ward_session' so UI loads
    await checkActiveWardSession(socket, wardIo, true);

    // 2. On Client Request: Just Join rooms (Don't emit, prevents loop)
    socket.on("join_active_session", async () => {
      // console.log(`[Ward-Socket] 🔄 Joining active rooms for ${socket.user.username}`);
      await checkActiveWardSession(socket, wardIo, false);
    });

    // 3. Handle Patient Updates
    socket.on("trigger_patient_update", (data) => {
      const { sessionId, assignedRoom } = data;
      if (!sessionId) return;

      console.log(`[Ward-Socket] 📡 Update Zone: ${assignedRoom || 'Global'}`);

      // Notify Supervisors
      socket.to(`ward_session_${sessionId}_supervisors`).emit("patient_data_updated", {
        ...data,
        isRefresh: true
      });

      // Notify Specific Zone OR Global
      if (assignedRoom && assignedRoom !== "all") {
        socket.to(`ward_session_${sessionId}_zone_${assignedRoom}`).emit("patient_data_updated", {
          ...data,
          isRefresh: true,
        });
      } else {
        socket.to(`ward_session_${sessionId}`).emit("patient_data_updated", {
          ...data,
          isRefresh: true,
        });
      }
    });

    // 4. Handle Manual End Session
    socket.on("end_ward_session_manual", async ({ sessionId }) => {
      console.log(`[Ward-Socket] 🛑 Manual End: ${sessionId} by ${socket.user.username}`);
      await terminateSession(sessionId, wardIo);
    });

    socket.on("disconnect", () => {
      console.log(`[Ward-Socket] 🔴 Disconnected: ${socket.user.username}`);
    });
  });

  // ---------------------------------------------------------
  // 5. Auto-Expiry Loop (Runs every 60 seconds)
  // ---------------------------------------------------------
  setInterval(async () => {
    try {
      const activeSessions = await knex("wardsession")
        .select("*")
        .where({ status: "ACTIVE" });

      const now = new Date().getTime();

      for (const session of activeSessions) {
        // If duration is set (and not unlimited/null)
        if (session.duration) {
          const startTime = new Date(session.start_time).getTime();
          const durationMs = session.duration * 60 * 1000;

          // Check if time expired (buffer 5s)
          if (now > startTime + durationMs + 5000) {
            console.log(`[Ward-Socket] ⏰ Time expired for Session ${session.id}. Auto-ending.`);
            await terminateSession(session.id, wardIo);
          }
        }
      }
    } catch (e) {
      console.error("[Ward-Socket] Auto-expiry check failed:", e);
    }
  }, 60000); 

  return wardIo;
};

// --- Helpers ---

// Logic to Join Rooms based on Role/Assignment
// Added `shouldEmit` param to control feedback loop
async function checkActiveWardSession(socket, namespaceIo, shouldEmit = true) {
  try {
    const userId = socket.user.id;
    const userRole = socket.user.role.toLowerCase();

    const activeSessions = await knex("wardsession")
      .select("*")
      .where({ status: "ACTIVE" });

    for (const session of activeSessions) {
      let assignments = session.assignments;
      if (typeof assignments === "string") {
         try { assignments = JSON.parse(assignments); } catch(e) {}
      }

      let myZone = null;
      let isSupervisor = ["admin", "faculty", "observer", "superadmin"].includes(userRole);

      // Identify User's Zone
      if (!isSupervisor) {
        const zoneSource = assignments.zones || assignments;
        if (zoneSource && typeof zoneSource === 'object') {
            for (const [key, val] of Object.entries(zoneSource)) {
                const targetId = val.userId || (val.user && val.user.id);
                if (targetId && String(targetId) === String(userId)) {
                    myZone = key.replace("zone", "");
                    break;
                }
            }
        }
      }

      // If user belongs in this session
      if (isSupervisor || myZone) {
        const baseRoom = `ward_session_${session.id}`;
        
        socket.join(baseRoom); // Base room

        if (isSupervisor) socket.join(`${baseRoom}_supervisors`);
        if (myZone) socket.join(`${baseRoom}_zone_${myZone}`);
        
        // Only emit if requested (Prevents infinite loop on join_active_session)
        if (shouldEmit) {
            socket.emit("start_ward_session", {
                sessionId: session.id,
                wardId: session.ward_id,
                assignedRoom: myZone || "all",
                startedBy: session.started_by,
                startedByRole: "admin" // or fetch creator role
            });
        }
        return; 
      }
    }
  } catch (error) {
    console.error("[Ward-Socket] Check Active Session Error:", error);
  }
}

async function terminateSession(sessionId, wardIo) {
  try {
    await knex("wardsession").where({ id: sessionId }).update({ status: "COMPLETED" });
    wardIo.to(`ward_session_${sessionId}`).emit("end_ward_session", { sessionId });
  } catch (err) {
    console.error("Error terminating session:", err);
  }
}