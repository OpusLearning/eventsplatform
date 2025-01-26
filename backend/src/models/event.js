const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Event = sequelize.define("Event", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
module.exports = Event;
