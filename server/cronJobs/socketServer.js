// // cronJobs/socketServer.js
// const { Server } = require("socket.io");
// const Knex = require("knex");
// const cron = require("node-cron");

// const knexConfig = require("../knexfile").development;
// const knex = Knex(knexConfig);

// let io; // to export later

// function initScheduledSocket(server) {
//   io = new Server(server, {
//     cors: {
//       origin: [
//         "wss://sockets.mxr.ai:5000",
//       ],
//       methods: ["GET", "POST"],
//     },
//   });

//   // 🕒 CRON JOB — Check every minute
//   cron.schedule("* * * * *", async () => {
//     try {
//       const now = new Date();
//       const nowISO = now.toISOString().slice(0, 16);
//       console.log(nowISO,"bbbbbbbbbbbbbb")

//       const dueSockets = await knex("scheduled_sockets")
//         .where("schedule_time", "<=", nowISO)
//         .andWhere("status", "pending");
// console.log(nowISO, "nowISO");
// console.log(dueSockets, "dueSockets");
//       if (dueSockets.length > 0) {
//         console.log(`🔔 Found ${dueSockets.length} scheduled sockets`);

//         for (const s of dueSockets) {
//           io.emit("PlayAnimationEventEPR", {
//             sessionId: s.session_id,
//             patientId: s.patient_id,
//             title: s.title,
//             src: s.src,
//           });

//           await knex("scheduled_sockets")
//             .where({ id: s.id })
//             .update({ status: "completed" });

//           console.log(`✅ Socket triggered for "${s.title}"`);
//         }
//       }
//     } catch (error) {
//       console.error("❌ Error running cron job:", error);
//     }
//   });

//   console.log("✅ Socket scheduler initialized");
// }

// module.exports = { initScheduledSocket, getIO: () => io };

const { Server } = require("socket.io");
const Knex = require("knex");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

let io;

function initScheduledSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "https://inpatientsim.com",
        "https://www.inpatientsim.com",
        "https://simvpr.com",
        "http://localhost:5173",
      ],
      methods: ["GET", "POST"],
    },
  });

  cron.schedule("* * * * *", async () => {
    try {
      const now = dayjs().tz("Asia/Kolkata");
      const nowFormatted = now.format("YYYY-MM-DDTHH:mm");

      console.log("🕒 Current formatted time:", nowFormatted);

      const allSockets = await knex("scheduled_sockets").select("*");
      console.log("📋 ALL SCHEDULED SOCKETS:");
      allSockets.forEach((s) => {
        console.log(
          `   ID: ${s.id} | title: ${s.title} | schedule_time: ${s.schedule_time} | status: ${s.status}`
        );
      });

      const dueSockets = await knex("scheduled_sockets")
        .where("schedule_time", nowFormatted)
        .andWhere("status", "pending");

      console.log("🎯 Found sockets:", dueSockets.length);

      if (dueSockets.length > 0) {
        for (const s of dueSockets) {
          console.log(s, "JHGHGGGGGGGGGGGGGG");
          io.emit("PlayAnimationEventEPR", {
            sessionId: s.session_id,
            patientId: s.patient_id,
            title: s.title,
            src: s.src,
          });

          await knex("scheduled_sockets")
            .where({ id: s.id })
            .update({ status: "completed" });

          console.log(`✅ Socket triggered for "${s.title}"`);
        }
      }
    } catch (error) {
      console.error("❌ Error running cron job:", error);
    }
  });

  console.log("✅ Socket scheduler initialized");
}

module.exports = { initScheduledSocket, getIO: () => io };
