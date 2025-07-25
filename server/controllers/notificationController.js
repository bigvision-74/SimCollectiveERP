const { defaultApp } = require("../firebase");
const messaging = defaultApp.messaging();
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

exports.sendNotificationToFaculties = async (req, res) => {
  try {
    // const userId = req.params.userId;
    const { facultiesIds, payload, userId } = req.body;
    console.log(facultiesIds, "facultiesIds");
    if (!facultiesIds?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No faculty IDs provided" });
    }
    const tokens = facultiesIds.map((f) => f.fcm_token).filter(Boolean);

    console.log(tokens, "tokenstokens");

    const notificationPayload = {
      notification: {
        title: "New Investigation Request",
        body: "A new test request has been assigned.",
      },
      data: {
        from_user: userId.toString(),
        payload: JSON.stringify(payload),
      },
    };

    let response;

    const responses = [];
    for (const token of tokens) {
      const res = await messaging.send({
        ...notificationPayload,
        token,
      });
      responses.push(res);
    }

    console.log("Notification sent successfully:", response);

    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error("Error sending to topic:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notifications." });
  }
};

// send notifaction when faculty accept admin request function 
exports.sendNotificationToAdmin = async (req, res) => {
  try {
    const { adminId, patientName } = req.body;

    if (!adminId) {
      return res
        .status(400)
        .json({ success: false, message: "Admin ID is required" });
    }

    const admin = await knex("users").where({ id: adminId }).first();

    // Fetch admin with FCM token
    const token = admin.fcm_token;

    const notificationPayload = {
      notification: {
        title: "New Investigation Result Submitted",
        body: `Results submitted for ${patientName || "a patient"}.`,
      },
      data: {
        type: "investigation_result",
        for_user: adminId.toString(),
      },
    };

    const response = await messaging.send({
      ...notificationPayload,
      token,
    });

    console.log("Admin notification sent successfully:", response);

    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error("Error sending to admin:", err); // <-- very important
    res.status(500).json({
      success: false,
      message: "Failed to send notifications.",
      error: err.message || err,
    });
  }

};


