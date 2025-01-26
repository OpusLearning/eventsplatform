// jest.config.js

// Make sure dotenv loads our .env.test file first
require("dotenv").config({ path: ".env.test" });

module.exports = {
  testEnvironment: "node",
  // or any other Jest config you use
};
