// server.js

require("dotenv").config();
const express = require('express');
const app = express();
const PORT = 5000;
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const presignedUrl = require("./routes/s3routes");
const orgRoutes = require("./routes/orgRoutes");
const patientRoute = require("./routes/patientRoute");
const archiveRoutes = require("./routes/archiveRoutes");
const paymentRoutes  = require("./routes/paymentRoutes");
const settingRoutes = require("./routes/settingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const json11 = require("./i18n/en_uk.json");
const json22 = require("./i18n/es.json");
const json33 = require("./i18n/fr.json");
const json44 = require("./i18n/en.json");
const helmet = require("helmet");
const cors = require("cors");


// Middleware (optional)
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: "https://simvpr.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-name"],
  })
);

app.use(helmet({
  hidePoweredBy: { setTo: 'null' },
}));

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

app.use(userRoutes);
app.use(adminRoutes);
app.use(presignedUrl);
app.use(orgRoutes);
app.use(patientRoute);
app.use(archiveRoutes);
app.use(paymentRoutes);
app.use(settingRoutes);
app.use(notificationRoutes);

app.use("/i18n", express.static(path.join(__dirname, "i18n")));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

