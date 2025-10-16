require("dotenv").config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const helmet = require("helmet");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const presignedUrl = require("./routes/s3routes");
const orgRoutes = require("./routes/orgRoutes");
const patientRoute = require("./routes/patientRoute");
const archiveRoutes = require("./routes/archiveRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const settingRoutes = require("./routes/settingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const sessions = require("./routes/sessionRoutes");
const apis = require("./routes/apiRoutes");
const virtualRoutes = require("./routes/virtualRoutes");

const { initWebSocket } = require('./websocket');
const { initScheduledJobs } = require('./services/sessionScheduler');

const json1 = require("./i18n/en_uk.json");
const json2 = require("./i18n/es.json");
const json3 = require("./i18n/fr.json");
const json4 = require("./i18n/en.json");
const json5 = require("./i18n/It.json");
const json6 = require("./i18n/pt.json");
const json7 = require("./i18n/de.json");

function compareKeys(json1, json2) {
  const keys1 = new Set(Object.keys(json1));
  const keys2 = new Set(Object.keys(json2));
  const missingInJson1 = [...keys2].filter((key) => !keys1.has(key));
  const missingInJson2 = [...keys1].filter((key) => !keys2.has(key));
  return {
    areKeysEqual: missingInJson1.length === 0 && missingInJson2.length === 0,
    missingInJson1,
    missingInJson2,
  };
}

// console.log(compareKeys(json1, json2))

//const corsOptions = {
//  origin: process.env.CLIENT_URL || "http://localhost:5173" || "https://inpatientsim.com" || "https://www.inpatientsim.com", 
// methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// credentials: true,
// allowedHeaders: ["Content-Type", "Authorization"]
//};

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://simvpr.com",
  "https://inpatientsim.com",
  "https://www.inpatientsim.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-user-name"],
};

app.use(cors(corsOptions));
app.use(helmet({
  hidePoweredBy: { setTo: 'null' },
}));
app.use(express.json());
app.use(cookieParser());

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
app.use(sessions);
app.use(notificationRoutes);
app.use(apis)
app.use(virtualRoutes);

app.use("/i18n", express.static(path.join(__dirname, "i18n")));

const server = http.createServer(app);

initWebSocket(server);
initScheduledJobs();

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});