// server.js

const express = require('express');
const app = express();
const PORT = 5000;
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const json11 = require("./i18n/en_uk.json");
const json22 = require("./i18n/es.json");
const json33 = require("./i18n/fr.json");
const json44 = require("./i18n/en.json");
const helmet = require("helmet");
const cors = require("cors");
// Middleware (optional)
app.use(cors());
app.use(express.json());
require("dotenv").config();
app.use(
  cors({
    origin: "http://localhost:5173",
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
app.use("/i18n", express.static(path.join(__dirname, "i18n")));

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

 