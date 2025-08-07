const { defaultApp } = require("../firebase");
const messaging = defaultApp.messaging();
const Knex = require("knex");
const knexConfig = require("../knexfile").development;
const knex = Knex(knexConfig);
const { getIO } = require("../websocket");

exports.sendNotificationToFaculties = async (req, res) => {
  try {
    const { facultiesIds, payload, userId } = req.body;
    const io = getIO();
    console.log("socket calls");
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
    const payload1 = {
      facultiesIds: facultiesIds,
      payload: newRequests,
      userId: userId,
    };

    io.emit("notificationPopup", {
      title: "New Investigation Request Recieved",
      body: "A new test request is recieved.",
      payload: payload1, // Make sure payload is properly structured
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
// exports.sendNotificationToFaculties = async (req, res) => {
//   try {
//     const { facultiesIds, payload, userId } = req.body;

//     if (!facultiesIds?.length) {
//       return res
//         .status(400)
//         .json({ success: false, message: "No faculty IDs provided" });
//     }

//     if (!payload?.length) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Payload is empty" });
//     }

//     const filteredFaculties = facultiesIds.filter(
//       (f) => f.id !== Number(userId)
//     );
//     const tokens = filteredFaculties.map((f) => f.fcm_token).filter(Boolean);

//     // Step 1: Get patient ID and test names from payload
//     const patientId = payload[0].patient_id; // assuming all payload entries have same patient_id
//     const testNames = payload.map((item) => item.test_name);

//     // Step 2: Query existing test names for this patient
//     const existingRequests = await knex("request_investigation")
//       .where("patient_id", patientId)
//       .whereIn("test_name", testNames)
//       .select("test_name");

//     const existingTestNames = existingRequests.map((r) => r.test_name);

//     // Step 3: Filter only new test requests
//     const newRequests = payload.filter(
//       (item) => !existingTestNames.includes(item.test_name)
//     );

//     if (newRequests.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No new test requests to notify.",
//         notified: false,
//       });
//     }

//     // Step 4: Build notification payload
//     const userData = await knex("users").where("id", userId).first();

//     const notificationPayload = {
//       notification: {
//         title: "New Investigation Request",
//         body: `A new test request has been assigned by ${userData.username}`,
//       },
//       data: {
//         from_user: userId.toString(),
//         payload: JSON.stringify(newRequests),
//       },
//     };

//     // Step 5: Send notifications
//     const responses = [];
//     for (const token of tokens) {
//       const response = await messaging.send({
//         ...notificationPayload,
//         token,
//       });
//       responses.push(response);
//     }

//     res.status(200).json({
//       success: true,
//       message: "Notifications sent for new test requests.",
//       responses,
//       notified: true,
//     });
//   } catch (err) {
//     console.error("Error sending notifications:", err);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to send notifications." });
//   }
// };

exports.sendNotificationToAllAdmins = async (req, res) => {
  try {
    const { adminIds, payload, userId } = req.body;
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

    enrichedPayload = [
      ...new Map(
        enrichedPayload.map((item) => [
          item.investigation_id,
          {
            investigation_id: item.investigation_id,
            patient_id: item.patient_id,
            test_name: item.test_name,
            submitted_by: item.submitted_by,
          },
        ])
      ).values(),
    ];

    console.log(enrichedPayload, "enrichedPayloadenrichedPayload");
    if (enrichedPayload.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No new test requests to notify.",
        notified: false,
      });
    }

    // Step 4: Build notification payload
    const userData = await knex("users").where("id", userId).first();
    io.emit("notificationPopup", {
      title: "New Investigation Report Received",
      body: "A new test report is submitted.",
      payload: enrichedPayload, // Make sure payload is properly structured
    });
    // const notificationPayload = {
    //   notification: {
    //     title: "New Investigation Report Recieved",
    //     body: `A new test report of ${patientdeatials?.[0]?.name} for ${testName} has been submitted by ${userData.username}`,
    //   },
    //   data: {
    //     from_user: userId.toString(),
    //     payload: JSON.stringify(enrichedPayload),
    //   },
    // };
    // console.log("Sending payload:", notificationPayload);

    // // Step 5: Send notifications
    // const responses = [];
    // for (const token of allTokens) {
    //   const response = await messaging.send({
    //     ...notificationPayload,
    //     token,
    //   });
    //   responses.push(response);
    // }

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

exports.sendNotificationToAddNote = async (req, res) => {
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

    const filteredFaculties = adminIds.filter((f) => f.id !== Number(userId));
    const tokens = filteredFaculties.map((f) => f.fcm_token).filter(Boolean);

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
        title: "New Note Added",
        body: `New Note Added`,
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
