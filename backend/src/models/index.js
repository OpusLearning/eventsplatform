const sequelize = require("../config/database");
const Event = require("./event");
const User = require("./user");
const SignUp = require("./signup");

// Associations
Event.belongsToMany(User, { through: SignUp }); // Many-to-Many relationship between Event and User
User.belongsToMany(Event, { through: SignUp }); // Many-to-Many relationship between User and Event
SignUp.belongsTo(Event, {
  foreignKey: "EventId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
}); // Foreign key for Event
SignUp.belongsTo(User, {
  foreignKey: "UserId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
}); // Foreign key for User

// Sync models
if (process.env.NODE_ENV === "test") {
  sequelize
    .sync({ force: true }) // Force sync during testing to reset the database
    .then(() => {
      console.log("Database synced for testing!");
    })
    .catch((error) => {
      console.error("Error syncing database:", error);
    });
} else {
  sequelize
    .sync() // Non-destructive sync for production
    .then(() => {
      console.log("Database synced!");
    })
    .catch((error) => {
      console.error("Error syncing database:", error);
    });
}

module.exports = { sequelize, Event, User, SignUp };
