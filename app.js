const express = require("express");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const path = require("path");

// database connectie
const db = require("./config/database");

// // Om cookies te plaatsen in de browser
// let cookieParser = require("cookie-parser");

// // om een sessie bij te houden (ingelogd of niet)
// let session = require("express-session");

// controleren van de database verbinding
db.authenticate()
  .then(() => console.log("Database connected ..."))
  .catch(err => console.log("Error: " + err));

// express voor routers
const app = express();

// definieer een default layout
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Maak public map direct toegankelijk vanuit ieder path
app.use(express.static(path.join(__dirname, "public")));

//
// app.use(cookieParser());

// Bodyparser -> Voor het uitlezen van de form die bij add gig ingevuld kan worden
app.use(bodyParser.urlencoded({ extended: false }));

// homepage: localhost:5000
app.get("/", (req, res) => res.send("Homepage"));

// link naar users.js met alle adressen/pagina's
app.use("/posts", require("./routes/posts"));

// maak een poort aan om op te luisteren
const PORT = process.env.PORT || 5000;

// Luister naar de poort
app.listen(PORT, console.log(`Server started on port ${PORT}`));
