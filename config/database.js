// Sequelize is de package waarmee we praten met een database (net als SQL)
const Sequelize = require("sequelize");

// 1e postgres: database - 2e postgres: username
module.exports = new Sequelize("foo", "postgres", "ddacolombia", {
  host: "localhost",
  dialect: "postgres",

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
