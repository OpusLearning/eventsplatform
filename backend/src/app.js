// backend/src/app.js

const express = require("express");
const cors = require("cors");
const passportConfig = require("./services/passport-config");
const { syncDatabase } = require("./models"); // Import syncDatabase
const app = express();

// Conditionally load environment variables from .env in non-production environments
if (process.env.NODE_ENV !== "production") {
  const dotenv = require("dotenv");
  const path = require("path");
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

// Debug: confirm that JWT_SECRET is loaded
console.log("[DEBUG] app.js => process.env.JWT_SECRET:", process.env.JWT_SECRET);

// Middleware
app.use(cors());
app.use(express.json()); // Use built-in middleware instead of bodyParser

// Initialize Passport for JWT and Google OAuth
passportConfig(app);

// Import routes
const eventRoutes = require("./routes/events");
const authRoutes = require("./routes/auth");

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
  syncDatabase()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
      console.error("Failed to sync database:", error);
      process.exit(1); // Exit the process with failure
    });
}

