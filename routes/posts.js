// Express om routers te gebruiken
const express = require("express");

// om een sessie bij te houden (ingelogd of niet)
let session = require("express-session");

// routers om de adressen uit de webbrowser uit te lezen
// const router = express.Router();

// Breng ons model van posts naar deze pagina
const Post = require("../models/Post");

// Breng ons model van register naar deze pagina
const Register = require("../models/Register");

// // association ( default: post krijgt een id van register: namelijk 'modelnaan+Id' => registerId )
Post.belongsTo(Register);
Register.hasMany(Post);

// Encrypten van password
const bcrypt = require("bcryptjs");

const app = express();

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    name: "userId",
    resave: false,
    saveUninitialized: false,
    secret: "somerandonstuffs",
    cookie: {
      maxAge: 600000,
      sameSite: true,
      secure: false // false: works also on http: addresses. true: works only on https addresses (for the sake of safety)
    }
  })
);

// ************************** Middleware **************************
// Wordt aangeroepen bij iedere get request voor router (router.get())
const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    console.log("Geen userId in session gevonden => login");
    res.redirect("login");
  } else {
    console.log("Session beschikt over userId => next");
    next();
  }
};

const redirectDashboard = (req, res, next) => {
  if (req.session.userId) {
    console.log("Session beschikt over userId => dashboard");
    res.redirect("dashboard");
  } else {
    console.log("Geen userId in session gevonden => next");
    next();
  }
};
// ************************** Middleware **************************

// ************************** DASHBOARD **************************
app.get("/dashboard", redirectLogin, (req, res) => {
  const userId = req.session.userId;
  console.log("ID voor dashboard: " + userId);
  Register.findOne({
    where: {
      id: userId
    }
  }).then(user => {
    if (!user) {
      res.redirect("login");
    } else {
      res.render("dashboard", user.dataValues);
    }
  });
});
// ************************** DASHBOARD **************************

// ************************** HOME PAGE **************************
// De pagina met alle users (we zitten in /users al => '/' is dus localhost:5000/users)

app.get("/", (req, res) => {
  // console.log(req.session);

  Post.findAll({
    order: [["id", "DESC"]],
    // attributes: ["description"],
    include: [
      {
        model: Register,
        attributes: ["username", "id"]
      }
    ]
  })
    .then(posts => {
      // console.log(posts);

      res.render("posts", {
        posts
      });
    })
    .catch(err => console.log("Error: " + err));
});

// });
// // ************************** HOME PAGE **************************

// // ************************** LOGIN PAGE **************************

app.get("/login", redirectDashboard, (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let { username, password } = req.body;
  let errors = [];
  // check if exist
  Register.findOne({
    where: {
      username: username
    }
  }).then(user => {
    if (!user) {
      // User bestaat niet
      console.log("username is niet bekent");
      errors.push({ text: "Username is not registerd yet" });
      res.render("login", {
        errors,
        username,
        password
      });
    } else if (!user.validPassword(password)) {
      console.log("Passwoord is incorrect");
      errors.push({ text: "Password incorrect" });
      res.render("login", {
        errors,
        username,
        password
      });
    } else {
      // User bestaat
      // cookies
      console.log("gevonden user id: " + user.id);
      req.session.userId = user.id;
      console.log("");

      res.redirect("/posts/dashboard");
    }
  });
  //
});

// ************************** LOGIN PAGE **************************

// ************************** LOGOUT PAGE **************************
app.get("/logout", (req, res) => {
  // Clear cookie
  res.clearCookie("userId");
  res.redirect("login");
});
// ************************** LOGOUT PAGE **************************

// // ************************** REGISTER **************************
// Pagina laden
app.get("/register", (req, res) => res.render("register"));

// Post request
app.post("/register", (req, res) => {
  let { email, username, fname, lname, password, password2 } = req.body;
  let errors = [];

  if (!password || !password2) {
    console.log("Password niet ingevuld");
    errors.push({ text: "Please enter twice your password" });
  }

  if (password != password2) {
    console.log("Passwords niet hetzelfde");
    errors.push({ text: "Passwords don't match" });
  }

  if (!email) {
    console.log("Geen email ingevuld");
    errors.push({ text: "Enter your email address" });
  }
  if (!fname) {
    console.log("Geen voornaam ingevuld");
    errors.push({ text: "Enter your first name" });
  }
  if (!lname) {
    console.log("Geen achternaam ingevuld");
    errors.push({ text: "Enter your last name" });
  }
  if (!username) {
    console.log("Geen username ingevuld");
    errors.push({ text: "Enter a username" });
  }
  if (errors.length > 0) {
    console.log("errors gevonden, render pagina opnieuw");
    res.render("register", {
      errors,
      username,
      fname,
      lname,
      email,
      password,
      password2
    });
  } else {
    Register.findOne({
      where: {
        email: email
      }
    }).then(exist => {
      if (exist) {
        console.log("Dit account bestaat al");
        errors.push({ text: "Email and/or username already registered" });
        res.render("register", {
          errors,
          username,
          fname,
          lname,
          email,
          password,
          password2
        });
      } else {
        Register.findOne({
          where: {
            username: username
          }
        }).then(exist => {
          if (exist) {
            console.log("Deze username bestaat al");
            errors.push({ text: "Username already registered" });
            res.render("register", {
              errors,
              username,
              fname,
              lname,
              email,
              password,
              password2
            });
          } else {
            Register.create({
              fname,
              username,
              lname,
              email,
              password
            })
              .then(post => {
                res.redirect("login");
              })
              .catch(err => console.log("Error: " + err));
          }
        });
      }
    });
  }
});
//

// // ************************** REGISTER **************************

// ************************** UPDATE **************************
// Update scherm
app.get("/update", (req, res) => res.render("update"));

// Update handler
app.post("/update", (req, res) => {
  let { fname, lname, email, password } = req.body;
  let errors = [];

  Register.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (!user) {
      console.log("Geen geregistreerd email adres");
      errors.push({ text: "Email is nog niet geregistreerd" });
      res.render("update", {
        errors,
        fname,
        lname,
        email
      });
    } else if (!user.validPassword(password)) {
      console.log("Passwoord is incorrect");
      errors.push({ text: "Password is incorrect" });
      res.render("update", {
        errors,
        fname,
        lname,
        email
      });
    } else {
      Register.update(
        {
          fname: fname,
          lname: lname
        },
        {
          where: {
            email: email
          }
        }
      ).then(() => {
        res.redirect("/posts");
      });
    }
  });
});
// ************************** UPDATE **************************

// // ************************** DELETE **************************

// Delete page
app.get("/delete", (req, res) => {
  res.render("delete");
});

// Delete handler
app.post("/delete", (req, res) => {
  console.log("er is op delete gedrukt");
  let { email } = req.body;
  let errors = [];

  Register.findOne({
    where: {
      email: email
    }
  }).then(user => {
    if (user) {
      let thisUser = user.dataValues;
      console.log(thisUser);
      console.log(thisUser.fname);
      console.log(thisUser.lname);
      console.log(thisUser.email);

      Register.destroy({
        where: {
          id: thisUser.id
        }
      })
        .then(() => console.log("User deleted"))
        .catch(err => console.log(err));

      Post.destroy({
        where: {
          registerId: thisUser.id
        }
      })
        .then(() => {
          console.log("Posts deleted");
          // Clear cookie
          res.clearCookie("userId");
          res.redirect("/posts");
        })
        .catch(err => console.log(err));
    } else {
      errors.push({ text: "Vul een bestaand email adres in" });
      res.render("delete", { errors });
    }
  });
});

// ************************** DELETE **************************

// // ************************** ADD **************************

// Render de pagina waar je iemand kan toevoegen
app.get("/add", redirectLogin, (req, res) => res.render("add"));

// Als er een POST wordt gemaakt
app.post("/add", (req, res) => {
  // find user
  if (req.session.userId) {
    const { userId } = req.session;
    console.log("userId voor Add item: " + userId);
    Register.findOne({
      where: {
        id: userId
      }
    }).then(user => {
      if (user) {
        console.log("er is op submit gedrukt voor user:");
        postingUser = user.dataValues;
        console.log(postingUser);
        let { description } = req.body;
        let errors = [];

        if (!description) {
          console.log("description niet ingevuld");
          errors.push({ text: "Please enter a description for your post" });
        }

        if (errors.length > 0) {
          console.log("errors gedetecteerd");
          res.render("add", {
            errors,
            description
          });
        } else {
          Post.create({
            username: postingUser.username,
            email: postingUser.email,
            description,
            registerId: postingUser.id
          }).then(result => res.redirect("/posts"));
        }
      } else {
        console.log("Geen user gevonden... terwijl wel ingelogd... error!");
        res.redirect("logout");
      }
    });
  } else {
    console.log(" nog niet ingelogd");
    res.redirect("login");
  }

  // console.log("er is op submit gedrukt");
  // let { email, description, password } = req.body;
  // let errors = [];

  // if (!email) {
  //   console.log("email niet ingevuld");
  //   errors.push({ text: "Please enter your email address" });
  // }
  // if (!password) {
  //   console.log("paswoord niet ingevuld");
  //   errors.push({ text: "Please enter your password" });
  // }
  // if (!description) {
  //   console.log("description niet ingevuld");
  //   errors.push({ text: "Please enter a description for your post" });
  // }

  // if (errors.length > 0) {
  //   console.log("errors gedetecteerd");
  //   res.render("add", {
  //     errors,
  //     email,
  //     description,
  //     password
  //   });
  // } else {
  //   console.log("geen errors, mag door");
  //   Register.findAll({
  //     // attributes: ["password", "username"],
  //     raw: true,

  //     where: {
  //       email: email
  //     }
  //   }).then(function(post) {
  //     if (post.length != 0) {
  //       console.log("email bestaat");

  //       let username = post[0].username;
  //       let post_to_register_id = post[0].id;

  //       // let usern = JSON.parse(JSON.stringify(post, null, 4));
  //       // let username = usern[0].username;
  //       console.log("username: " + username);

  //       // console.log("Username: " + Object.values(post[0].username));

  //       // decrypten van password
  //       console.log("Er is een wachtwoord gevonden: ", post[0].password);
  //       // let pw = Object.values(post[0].password);
  //       // console.log(pw[0].password);
  //       let pw = post[0].password;

  //       bcrypt.compare(password, pw, (err, isMatch) => {
  //         if (err) throw err;
  //         if (isMatch) {
  //           console.log("password komt overeen voor user: " + username);
  //           Post.create({
  //             username: username,
  //             email,
  //             description,
  //             registerId: post_to_register_id
  //           }).then(result => res.redirect("/posts"));
  //         } else {
  //           console.log("password komt niet overeen");
  //           errors.push({ text: "paswoord komt niet over" });
  //           res.render("add", {
  //             errors,
  //             email,
  //             description,
  //             password
  //           });
  //         }
  //       });
  //     } else {
  //       console.log("Email adres is niet geregistreerd");
  //       errors.push({ text: "Email is not registered, please register first" });

  //       res.render("add", {
  //         errors,
  //         email,
  //         description,
  //         password
  //       });
  //     }
  //   });
  // }
});

// ************************** ADD **************************

module.exports = app;
