require("dotenv").config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");
const http = require('http');
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
const helmet = require("helmet");
const cors = require("cors");
const { initWebSocket } = require('./websocket');
const { initScheduledJobs } = require('./services/sessionScheduler');

//const corsOptions = {
//  origin: process.env.CLIENT_URL || "http://localhost:5173" || "https://inpatientsim.com" || "https://www.inpatientsim.com", 
 // methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
 // credentials: true,
 // allowedHeaders: ["Content-Type", "Authorization"]
//};

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
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
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware (optional)
app.use(cors());
app.use(express.json());

app.use(
  cors({
    // origin: "https://simvpr.com",
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-name"],
  })
);

app.use(cors(corsOptions));
app.use(helmet({
  hidePoweredBy: { setTo: 'null' },
}));
app.use(express.json());


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


app.use("/i18n", express.static(path.join(__dirname, "i18n")));

const server = http.createServer(app);

initWebSocket(server);

initScheduledJobs();

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});