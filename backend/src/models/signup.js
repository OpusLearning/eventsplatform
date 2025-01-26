const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// SignUp model
const SignUp = sequelize.define(
  "SignUp",
  {
    EventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Events",
        key: "id",
      },
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
  }
);

module.exports = SignUp;
