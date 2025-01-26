const { Sequelize } = require("sequelize");

// SQLite con
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

module.exports = sequelize;
