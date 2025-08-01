const { defaultApp } = require("../firebase");
const messaging = defaultApp.messaging();
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);

exports.sendNotificationToFaculties = async (req, res) => {
  try {
    const { facultiesIds, payload, userId } = req.body;

    if (!facultiesIds?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No faculty IDs provided" });
    }

    if (!payload?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Payload is empty" });
    }

    const filteredFaculties = facultiesIds.filter(
      (f) => f.id !== Number(userId)
    );
    const tokens = filteredFaculties.map((f) => f.fcm_token).filter(Boolean);

    // Step 1: Get patient ID and test names from payload
    const patientId = payload[0].patient_id; // assuming all payload entries have same patient_id
    const testNames = payload.map((item) => item.test_name);

    // Step 2: Query existing test names for this patient
    const existingRequests = await knex("request_investigation")
      .where("patient_id", patientId)
      .whereIn("test_name", testNames)
      .select("test_name");

    const existingTestNames = existingRequests.map((r) => r.test_name);

    // Step 3: Filter only new test requests
    const newRequests = payload.filter(
      (item) => !existingTestNames.includes(item.test_name)
    );

    if (newRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new test requests to notify.",
        notified: false,
      });
    }

    // Step 4: Build notification payload
    const userData = await knex("users").where("id", userId).first();

    const notificationPayload = {
      notification: {
        title: "New Investigation Request",
        body: `A new test request has been assigned by ${userData.username}`,
      },
      data: {
        from_user: userId.toString(),
        payload: JSON.stringify(newRequests),
      },
    };

    // Step 5: Send notifications
    const responses = [];
    for (const token of tokens) {
      const response = await messaging.send({
        ...notificationPayload,
        token,
      });
      responses.push(response);
    }

    res.status(200).json({
      success: true,
      message: "Notifications sent for new test requests.",
      responses,
      notified: true,
    });
  } catch (err) {
    console.error("Error sending notifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notifications." });
  }
};

exports.sendNotificationToAllAdmins = async (req, res) => {
  try {
    const { adminIds, payload, userId } = req.body;

    if (!adminIds?.length) {
      return res
        .status(400)
        .json({ success: false, message: "No faculty IDs provided" });
    }

    if (!payload?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Payload is empty" });
    }

    const filteredFaculties = adminIds.filter(
      (f) => f.id !== Number(userId)
    );
    const tokens = filteredFaculties.map((f) => f.fcm_token).filter(Boolean);

    // Step 1: Get patient ID and test names from payload
    // const patientId = payload[0].patient_id; // assuming all payload entries have same patient_id
    // const testNames = payload.map((item) => item.test_name);

    // // Step 2: Query existing test names for this patient
    // const existingRequests = await knex("request_investigation")
    //   .where("patient_id", patientId)
    //   .whereIn("test_name", testNames)
    //   .select("test_name");

    // const existingTestNames = existingRequests.map((r) => r.test_name);

    // // Step 3: Filter only new test requests
    // const newRequests = payload.filter(
    //   (item) => !existingTestNames.includes(item.test_name)
    // );

    if (payload.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new test requests to notify.",
        notified: false,
      });
    }

    // Step 4: Build notification payload
    const userData = await knex("users").where("id", userId).first();

    const notificationPayload = {
      notification: {
        title: "New Investigation Report Recieved",
        body: `A new test report has been submitted by ${userData.username}`,
      },
      data: {
        from_user: userId.toString(),
        payload: JSON.stringify(payload),
      },
    };

    // Step 5: Send notifications
    const responses = [];
    for (const token of tokens) {
      const response = await messaging.send({
        ...notificationPayload,
        token,
      });
      responses.push(response);
    }

    res.status(200).json({
      success: true,
      message: "Notifications sent for new test requests.",
      responses,
      notified: true,
    });
  } catch (err) {
    console.error("Error sending notifications:", err);
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
