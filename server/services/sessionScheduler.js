const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const cron = require("node-cron");
const { getIO } = require("../websocket");

const checkAndEndExpiredSessions = async () => {
  try {
    const activeSessions = await knex("session").where({ state: "active" });

    if (activeSessions.length === 0) {
      return;
    }

    const io = getIO();
    const now = new Date();

    for (const session of activeSessions) {
      const startTime = new Date(session.startTime);
      const durationInMinutes = session.duration;

      const expirationTime = new Date(
        startTime.getTime() + durationInMinutes * 60000
      );

      if (now >= expirationTime) {
        console.log(`Session ${session.id} has expired. Ending it now.`);

        await knex("session").where({ id: session.id }).update({
          state: "ended",
          endTime: now,
        });

        const createdByUser = await knex("users")
          .where({ id: session.createdBy })
          .first();
        if (createdByUser && createdByUser.organisation_id) {
          io.to(`org_${user.organisation_id}`).emit("session:ended", {
            sessionId: session.id,
            reason: "Time expired",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error during scheduled session check:", error);
  }
};

const initScheduledJobs = () => {
  const scheduledJob = cron.schedule("* * * * *", checkAndEndExpiredSessions);

  scheduledJob.start();
};

module.exports = { initScheduledJobs };
