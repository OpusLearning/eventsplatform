const express = require("express");
const { Event, User, SignUp } = require("../models");
const authenticate = require("../middleware/authenticate"); // Token validation
const roleMiddleware = require("../middleware/roleMiddleware"); // Role-based access control
const { body, validationResult } = require("express-validator"); // Request validation

const router = express.Router();

// GET /api/events - Fetch all events (Public)
router.get("/", async (req, res) => {
  try {
    const events = await Event.findAll();
    if (!events.length) {
      return res.status(404).json({ error: "No events found" });
    }
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/events - Create a new event (Admin only)
router.post(
  "/",
  authenticate, // Ensures user is logged in
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

// PUT /api/events/:id - Update an event (Admin only)
router.put(
  "/:id",
  authenticate,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await event.update(req.body);
      res.status(200).json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  }
);

// DELETE /api/events/:id - Delete an event (Admin only)
router.delete(
  "/:id",
  authenticate,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await event.destroy();
      res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  }
);

// POST /api/events/signup - Sign up a user for an event
router.post(
  "/signup",
  authenticate,
  [
    body("eventId").notEmpty().withMessage("Event ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventId } = req.body;
      const userId = req.user.id; // Extract from JWT

      const user = await User.findByPk(userId);
      const event = await Event.findByPk(eventId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const existingSignup = await SignUp.findOne({
        where: { UserId: userId, EventId: eventId },
      });

      if (existingSignup) {
        return res.status(400).json({ error: "User already signed up for this event" });
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
