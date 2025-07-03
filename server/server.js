// server.js

const express = require('express');
const app = express();
const PORT = 5000;
const userRoutes = require("./routes/userRoutes");
// Middleware (optional)
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

app.use(userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

 