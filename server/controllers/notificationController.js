const { defaultApp } = require("../firebase");
const messaging = defaultApp.messaging();

const sendNotificationToFaculties = async (req, res) => {
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

module.exports = {
  sendNotificationToFaculties,
};
