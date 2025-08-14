const { defaultApp } = require("../firebase");
const messaging = defaultApp.messaging();
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { getIO } = require("../websocket");

// send notification to all when investigation request submit
exports.sendNotificationToFaculties = async (req, res) => {
  try {
    const { facultiesIds, payload, userId, sessionId} = req.body;
    const io = getIO();
    const patientId = payload[0].patient_id;
    const testNames = payload.map((item) => item.test_name);

    const existingRequests = await knex("request_investigation")
      .where("patient_id", patientId)
      .where("status", "!=", "complete")
      .whereIn("test_name", testNames)
      .select("test_name");

    const existingTestNames = existingRequests.map((r) => r.test_name);

    const newRequests = payload.filter(
      (item) => !existingTestNames.includes(item.test_name)
    );
    const payload1 = {
      facultiesIds: facultiesIds,
      payload: newRequests,
      userId: userId,
    };

    const user = await knex("users").where({ id: userId }).first();

    const roomName = `session_${sessionId.sessionId}`;
    io.to(roomName).emit("notificationPopup", {
      roomName,
      title: "New Investigation Request Recieved",
      body: "A new test request is recieved.",
      payload: payload1,
    });

    res.status(200).json({
      success: true,
      message: "Notifications sent for new test requests.",
      notified: true,
    });
  } catch (err) {
    console.error("Error sending notifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notifications." });
  }
};

// send notification to all admin when test report submit
exports.sendNotificationToAllAdmins = async (req, res) => {
  try {
    const { adminIds, payload, userId, sessionId } = req.body;
    const io = getIO();

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

    const filteredFaculties = adminIds.filter((f) => f.id !== Number(userId));
    const tokens = filteredFaculties.map((f) => f.fcm_token).filter(Boolean);

    const investigation_id = payload[0].investigation_id;
    const patient_id = payload[0].patient_id;

    const existingRequests = await knex("investigation")
      .where("id", investigation_id)
      .select("test_name");

    const patientdeatials = await knex("patient_records")
      .where("id", patient_id)
      .select("name");

    const userIds = await knex("assign_patient")
      .where("patient_id", patient_id)
      .select("id");

    const additionalTokens = await knex("users")
      .whereIn("id", userIds)
      .whereNotNull("fcm_token") // Optional: skip nulls
      .pluck("fcm_token");

    // 3. Combine with your original tokens (if any)
    const allTokens = [...tokens, ...additionalTokens];
    const testName = existingRequests?.[0]?.test_name || "Unknown Test";

    let enrichedPayload = payload.map((item) => ({
      ...item,
      test_name: testName,
    }));
    const submittedByIds = [
      ...new Set(enrichedPayload.map((item) => item.submitted_by)),
    ];

    const users = await knex("users").whereIn("id", submittedByIds);
    const userOrgMap = new Map(
      users.map((user) => [user.id, user.organisation_id])
    );

    enrichedPayload = [
      ...new Map(
        enrichedPayload.map((item) => [
          item.investigation_id,
          {
            investigation_id: item.investigation_id,
            patient_id: item.patient_id,
            test_name: item.test_name,
            submitted_by: item.submitted_by,
            organisation_id: userOrgMap.get(item.submitted_by),
          },
        ])
      ).values(),
    ];

    // console.log(enrichedPayload, "enrichedPayloadenrichedPayload");
    if (enrichedPayload.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new test requests to notify.",
        notified: false,
      });
    }

    const user = await knex("users").where({ id: userId }).first();
    const roomName = `session_${sessionId.sessionId}`;
    io.to(roomName).emit("notificationPopup", {
      roomName,
      title: "New Investigation Report Received",
      body: "A new test report is submitted.",
      payload: enrichedPayload,
    });

    res.status(200).json({
      success: true,
      message: "Notifications sent for new test requests.",
      notified: true,
    });
  } catch (err) {
    console.error("Error sending notifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notifications." });
  }
};

// send notification to all when anything change in patient detail page
exports.sendNotificationToAddNote = async (req, res) => {
  try {
    const { payloadData, orgId, sessionId } = req.body;

    const io = getIO();
    const user = await knex("users").where({ organisation_id: orgId }).first();
    const createdByName = await knex("users").where({ id: payloadData.created_by }).first();

    const roomName = `session_${sessionId}`;
    io.to(roomName).emit("patientNotificationPopup", {
      roomName,
      title: payloadData.title,
      body: payloadData.body,
      orgId: orgId,
      created_by: createdByName.username,
      patient_id: payloadData.patient_id,
    });

    res.status(200).json({
      success: true,
      message: "New change in patient detail.",
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
