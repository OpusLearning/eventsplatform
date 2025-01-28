const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Ensure valid email format
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Add password field for authentication
  },
  role: {
    type: DataTypes.ENUM("user", "admin"), // Define roles
    allowNull: false,
    defaultValue: "user", // Default role is 'user'
  },
});

module.exports = User;
