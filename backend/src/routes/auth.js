// src/routes/auth.js
const express = require("express");
const passport = require("passport");

const router = express.Router();

// Google OAuth callback route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    // Simulated response for testing
    res.status(200).json({
      id: 1,
      name: "Test User",
      email: "testuser@example.com",
    });
  }
);

module.exports = router;
