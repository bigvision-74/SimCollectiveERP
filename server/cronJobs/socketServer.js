
const { Server } = require("socket.io");
const Knex = require("knex");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const { getIO } = require("../websocket");

dayjs.extend(utc);
dayjs.extend(timezone);

const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

function initScheduledSocket() {
  cron.schedule("* * * * *", async () => {
    try {
      const io = getIO();
      const now = dayjs();
      const nowFormatted = now.format("YYYY-MM-DDTHH:mm");

      const dueSockets = await knex("scheduled_sockets")
        .join(
          "virtual_section",
          "virtual_section.id",
          "scheduled_sockets.session_id"
        )
        .select(
          "scheduled_sockets.*",
          "virtual_section.selected_patient",
          "virtual_section.patient_type"
        )
        .where("scheduled_sockets.schedule_time", nowFormatted)
        .andWhere("scheduled_sockets.status", "pending");

      if (dueSockets.length > 0) {
        console.log(`🎯 Found ${dueSockets.length} scheduled sockets`);
        for (const s of dueSockets) {
          console.log(s, "sdfvhsjdghsjkdgh");
          io.emit("PlayAnimationEventEPR", {
            sessionId: s.session_id,
            patientId: s.patient_id,
            patient_type: s.patient_type,
            patient_id: s.selected_patient,
            title: s.title,
            src: s.src,
          });

          await knex("scheduled_sockets")
            .where({ id: s.id })
            .update({ status: "completed" });

          io.emit("ScheduledSocketTriggered", {
            id: s.id,
            title: s.title,
            session_id: s.session_id,
            schedule_time: s.schedule_time,
          });

          console.log(`✅ Socket triggered for "${s.title}"`);
        }
      }
    } catch (error) {
      console.error("❌ Error running cron job:", error);
    }
  });

  console.log("✅ Socket scheduler initialized");
}

module.exports = { initScheduledSocket };
