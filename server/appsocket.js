const { io: SocketIOClient } = require("socket.io-client");
const initMediaSocketClient = (io) => {
  const mediaSocket = SocketIOClient("wss://sockets.mxr.ai:5000", {
    transports: ["websocket"], 

  });

  mediaSocket.on("connect", () => {
    console.log("✅ [MediaClient] Successfully connected to Media Socket Server: wss://sockets.mxr.ai:5000");
  });

  mediaSocket.on("connect_error", (err) => {
    console.error(`❌ [MediaClient] Connection failed: ${err.message}`);
  });


  mediaSocket.on("JoinSessionEPR", async ({ sessionId, userData }) => {
    console.log(`[MediaClient] Received request for user ${userData.id} to join session ${sessionId}`);

    const sessionRoom = `session_${sessionId}`;
    
    const appUserRole = "user"; 
    const limits = { user: 3, observer: 1, faculty: 1 };

    try {
      const socketsInRoom = await io.in(sessionRoom).fetchSockets();

      const currentCountInSession = socketsInRoom.filter(
        (sock) => sock.user && sock.user.role.toLowerCase() === appUserRole
      ).length;

      if (currentCountInSession >= limits[appUserRole]) {
        console.log(`[MediaClient] Denying join for ${userData.id}: Session full for role '${appUserRole}'.`);
        mediaSocket.emit("JoinSessionEventEPR", { 
          success: false, 
          userId: userData.id,
          error: `The session is already full for the '${appUserRole}' role.`
        });
        return;
      }


    } catch (error) {
      console.error("[MediaClient] Error in JoinSessionEPR handler:", error);
      mediaSocket.emit("JoinSessionEventEPR", {
        success: false,
        userId: userData.id,
        error: "A server error occurred during eligibility check."
      });
    }
  });

  return mediaSocket;
};

module.exports = { initMediaSocketClient };