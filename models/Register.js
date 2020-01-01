// sequelize om te praten met database
const Sequelize = require("sequelize");

// Encrypten van password
const bcrypt = require("bcryptjs");

// link naar database om tabel uit te halen
const db = require("../config/database");

// aanmaken Model van de tabel users uit database
const Register = db.define("register", {
  fname: {
    type: Sequelize.STRING
  },
  lname: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password: {
    type: Sequelize.STRING
  },
  username: {
    type: Sequelize.STRING
  }
});

// Voordat de gebruiker wordt aangemaakt, wordt het wachtwoord eerst encrypt
Register.beforeCreate((user, options) => {
  const salt = bcrypt.genSaltSync();
  user.password = bcrypt.hashSync(user.password, salt);
});

// validPassword wordt onze funtie die de paswoorden controleert (returned => true or false)
Register.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// create all the defined tables in the specified database.
// db.sync()
//   .then(() => console.log("users table has been successfully created, if one doesn't exist"))
//   .catch(error => console.log("This error occured", error));

// maak het Model beschikbaar voor andere files
module.exports = Register;
