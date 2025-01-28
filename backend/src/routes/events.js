const express = require("express");
const { Event, User, SignUp } = require("../models");
const roleMiddleware = require("../middleware/roleMiddleware"); // Import the role-based middleware
const { body, validationResult } = require("express-validator"); // For validation

const router = express.Router();

// GET /api/events - Fetch all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.findAll();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/events - Create a new event (Admin only)
router.post(
  "/",
  roleMiddleware(["admin"]), // Restrict route to admin users
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("date").notEmpty().withMessage("Date is required"),
    body("location").notEmpty().withMessage("Location is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, date, location } = req.body;

      const newEvent = await Event.create({ title, date, location });
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }
);

// POST /api/events/signup - Sign up a user for an event
router.post(
  "/signup",
  [
    body("userId").notEmpty().withMessage("userId is required"),
    body("eventId").notEmpty().withMessage("eventId is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, eventId } = req.body;

      const user = await User.findByPk(userId);
      const event = await Event.findByPk(eventId);

      if (!user) {
        return res.status(404).json({ error: `User with ID ${userId} not found` });
      }
      if (!event) {
        return res.status(404).json({ error: `Event with ID ${eventId} not found` });
      }

      const existingSignup = await SignUp.findOne({
        where: { UserId: userId, EventId: eventId },
      });

      if (existingSignup) {
        return res.status(400).json({ error: "User is already signed up for this event" });
      }

      await SignUp.create({ UserId: userId, EventId: eventId });
      res.status(200).json({ message: "User signed up for event successfully" });
    } catch (error) {
      console.error("Error signing up for event:", error);
      res.status(500).json({ error: "Failed to sign up for event" });
    }
  }
);

module.exports = router;
