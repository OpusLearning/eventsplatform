// src/routes/events.js
const express = require("express");
const { Event, User, SignUp } = require("../models");

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

// POST /api/events - Create a new event
router.post("/", async (req, res) => {
  try {
    const { title, date, location } = req.body;

    if (!title || !date || !location) {
      return res
        .status(400)
        .json({ error: "Title, date, and location are required" });
    }

    const newEvent = await Event.create({ title, date, location });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// POST /api/events/signup - Sign up a user for an event
router.post("/signup", async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Basic validation
    if (!userId || !eventId) {
      return res
        .status(400)
        .json({ error: "userId and eventId are required" });
    }

    // Check if the user and event exist
    const user = await User.findByPk(userId);
    const event = await Event.findByPk(eventId);

    if (!user) {
      return res.status(404).json({ error: `User with ID ${userId} not found` });
    }
    if (!event) {
      return res
        .status(404)
        .json({ error: `Event with ID ${eventId} not found` });
    }

    // Check if user is already signed up for the event
    const existingSignup = await SignUp.findOne({
      where: { UserId: userId, EventId: eventId },
    });

    if (existingSignup) {
      return res
        .status(400)
        .json({ error: "User is already signed up for this event" });
    }

    // Create the sign-up record
    await SignUp.create({ UserId: userId, EventId: eventId });

    // Respond with the exact message your test expects
    res.status(200).json({ message: "User signed up for event successfully" });
  } catch (error) {
    console.error("Error signing up for event:", error);
    res.status(500).json({ error: "Failed to sign up for event" });
  }
});

module.exports = router;
