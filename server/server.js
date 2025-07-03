// server.js

const express = require('express');
const app = express();
const PORT = 5000;

// Middleware (optional)
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Hello from Express server!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

 