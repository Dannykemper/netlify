// sequelize om te praten met database
const Sequelize = require("sequelize");

// link naar database om tabel uit te halen
const db = require("../config/database");

// aanmaken Model van de tabel users uit database
const Post = db.define("post", {
  description: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  username: {
    type: Sequelize.STRING
  },
  registerId: {
    type: Sequelize.INTEGER
  }
});

// maak het Model beschikbaar voor andere files
module.exports = Post;
