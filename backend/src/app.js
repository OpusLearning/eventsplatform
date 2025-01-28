// src/app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Loads .env or .env.test depending on environment
//require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// Debug: confirm that JWT_SECRET is loaded
console.log("[DEBUG] app.js => process.env.JWT_SECRET:", process.env.JWT_SECRET);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Import routes
const eventRoutes = require("./routes/events");
const authRoutes = require("./routes/auth");
const passportConfig = require("./services/passport-config");

// Conditionally initialise Google OAuth if credentials are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passportConfig(app);
}

// Define routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Export the app for testing
module.exports = app;

// Start the server if not in test mode
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
