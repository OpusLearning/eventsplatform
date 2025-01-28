const sequelize = require("../config/database");
const Event = require("./event");
const User = require("./user");
const SignUp = require("./signup");
const Role = require("./role"); // Import Role model

// Associations
// Event <-> User: Many-to-Many via SignUp
Event.belongsToMany(User, { through: SignUp });
User.belongsToMany(Event, { through: SignUp });

// SignUp belongs to Event and User with cascading delete/update
SignUp.belongsTo(Event, {
  foreignKey: "EventId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
SignUp.belongsTo(User, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Role <-> User: Many-to-Many via UserRoles
User.belongsToMany(Role, { through: "UserRoles" });
Role.belongsToMany(User, { through: "UserRoles" });

// Sync models
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === "test") {
      // Force sync in test mode for a clean slate
      await sequelize.sync({ force: true });
      console.log("Database synced successfully for testing.");
    } else {
      // Non-destructive sync in production
      await sequelize.sync();
      console.log("Database synced successfully for production.");
    }
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

syncDatabase();

module.exports = { sequelize, Event, User, SignUp, Role }; // Export Role model
