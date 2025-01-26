// tests/auth.test.js
const request = require("supertest");
const app = require("../src/app");
const { sequelize, User } = require("../src/models");

// Mocking Google OAuth Strategy
jest.mock("passport-google-oauth20", () => {
  const Strategy = function (options, verify) {
    this.name = "google";
    this.authenticate = function (req, opts) {
      const mockProfile = {
        id: "google123",
        displayName: "Test User",
        emails: [{ value: "testuser@example.com" }],
      };

      // Simulate the verify callback: (accessToken, refreshToken, profile, done)
      verify("mockAccessToken", "mockRefreshToken", mockProfile, (error, user) => {
        if (error) {
          return this.error(error);
        }
        // Indicate success, so Passport can continue to the next middleware
        return this.success(user);
      });
    };
  };

  Strategy.Strategy = Strategy;
  return { Strategy };
});

// Database setup and teardown
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
    // Add a mock user to the database for testing
    await User.create({
      id: 1,
      name: "Test User",
      email: "testuser@example.com",
    });
  } catch (error) {
    console.error("Error during database setup (auth.test.js):", error);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error("Error closing the database (auth.test.js):", error);
  }
});

describe("Authentication API", () => {
  it("should authenticate a user using Google", async () => {
    const res = await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "mock-code" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 1,
        name: "Test User",
        email: "testuser@example.com",
      })
    );
  });

  it("should return 404 for unknown routes in auth", async () => {
    const res = await request(app).get("/api/auth/unknown");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Route not found",
      })
    );
  });
});
