const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const { sequelize, User } = require("../src/models");

// Mocking Google OAuth Strategy
jest.mock("passport-google-oauth20", () => {
  const Strategy = function (options, verify) {
    this.name = "google";
    this.authenticate = function () {
      const mockProfile = {
        id: "google123",
        displayName: "Test User",
        emails: [{ value: "testuser@example.com" }],
      };

      // Simulate the verify callback
      verify(
        "mockAccessToken",
        "mockRefreshToken",
        mockProfile,
        (error, user) => {
          if (error) {
            this.error(error);
          } else {
            this.success(user);
          }
        }
      );
    };
  };

  Strategy.Strategy = Strategy;
  return { Strategy };
});

// JWT secret for tests
const JWT_SECRET = process.env.JWT_SECRET || "dummy_jwt_secret";

// Database setup and teardown
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });

    // Add a mock user to the database for testing
    await User.create({
      id: 1,
      name: "Test User",
      email: "testuser@example.com",
      password: await bcrypt.hash("dummyPassword", 10), // Add hashed password
      role: "user", // Including role for role-based access control
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
        role: "user",
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

  it("should deny access if no authentication is provided", async () => {
    const res = await request(app).get("/api/auth/protected-route");
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Unauthorized",
      })
    );
  });

  it("should allow access to a protected route with valid JWT", async () => {
    const token = jwt.sign({ id: 1, role: "user" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .get("/api/auth/protected-route")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        message: "Authorized access",
      })
    );
  });
});
