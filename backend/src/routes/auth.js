// src/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/user");
const ensureRole = require("../middleware/roleMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// Debug: show whether JWT_SECRET is actually set
console.log("[DEBUG] auth.js => JWT_SECRET:", JWT_SECRET);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

// Google OAuth callback route
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    try {
      if (!req.query.code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const { id, displayName, emails } = req.user || {};
      if (!emails || emails.length === 0) {
        return res.status(400).json({ error: "No email found in Google profile" });
      }

      let user = await User.findOne({ where: { email: emails[0].value } });
      if (!user) {
        user = await User.create({
          name: displayName,
          email: emails[0].value,
        });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({ token, user });
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// User registration route
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const allowedRoles = ["user", "admin"];
      const userRole = allowedRoles.includes(role) ? role : "user";

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: userRole,
      });

      res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// User login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Destructure out password so we do not return it
    const { password: _, ...userWithoutPassword } = user.toJSON();

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Protected admin route
router.get("/admin", ensureRole(["admin"]), (req, res) => {
  res.status(200).json({ message: "Welcome, admin!" });
});

// Protected route with JWT
router.get(
  "/protected-route",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.status(200).json({ message: "Authorized access" });
  }
);

module.exports = router;
