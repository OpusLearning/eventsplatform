
// tests/events.test.js
const request = require("supertest");
const app = require("../src/app");
const { sequelize, Event, User } = require("../src/models");

// Database setup and teardown
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
    // Seed a test user
    await User.create({ id: 1, name: "Test User", email: "testuser@example.com" });
    // Seed a test event
    await Event.create({
      id: 100,
      title: "Sample Event",
      date: new Date("2025-01-30"),
      location: "London",
    });
  } catch (error) {
    console.error("Error during database setup (events.test.js):", error);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error("Error closing the database (events.test.js):", error);
  }
});

describe("Events API", () => {
  it("should fetch all events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: 100,
        title: "Sample Event",
        location: "London",
      })
    );
  });

  it("should create a new event", async () => {
    const newEvent = {
      title: "New Year Party",
      date: "2025-12-31",
      location: "Manchester",
    };

    const res = await request(app).post("/api/events").send(newEvent);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: "New Year Party",
        location: "Manchester",
      })
    );
  });

  it("should sign up a user for an event", async () => {
    const signupData = {
      userId: 1,
      eventId: 100,
    };

    const res = await request(app).post("/api/events/signup").send(signupData);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User signed up for event successfully");
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/events/unknownRoute");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Route not found",
      })
    );
  });
});
