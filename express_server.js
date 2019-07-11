// Express server for TinyApp
// Author: Thilina (@t5krishn)
// Main server file that should be run

// Modules required by server
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const methodOverride = require('method-override')


// Helper functions from helper.js
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helper');

// Initializing app with port
const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse request.body, request.cookies and method override
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));


// Previous data structure of urlDatabase, left for reference if needed
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

// Class used to create URLS
// class URL {

// }

// New data structure of urlDatabase with userID's added
const urlDatabase = {
  sgq3y6: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  as34aa: { longURL: "https://www.facebok.ca", userID: "asdasd" }
};

// Class used to create new Users
class User {
  constructor(email, password) {
    this.id = generateRandomString();
    this.email = email;
    this.password = password;
  }
}


// Object for storing all users registered
const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: "$2b$10$jvJIrAiTCwNwMZCVT7D0rONFDB2jvQ/EtyI42AY.XbutcA5I429Ey" //purple-monkey-dinosaur
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$rfj/5wpPtMRpH2ZZ0VCZjO3e1eODRGP.QKKyv9kQPVB5hecwYkXDu"//dishwasher-funk
  }
};


//----------------------------------------------------------//
//                 - ROUTES FOR TINYAPP -                   //
//----------------------------------------------------------//
//         - GET -            |           - PUT -           //
//----------------------------|-----------------------------//
//        /                   |    /urls                    //
//        /urls               |    /urls/:shortURL/delete   //
//        /urls/new           |    /logout                  //
//        /urls/:shortURL     |    /urls/:shortURL          //
//        /login              |    /login                   //
//        /register           |    /register                //
//        /u/:shortURL        |-----------------------------//
//----------------------------------------------------------//


// --------------------------------------------------------------------------------
//                            GET PATHS
// --------------------------------------------------------------------------------

app.get("/", (req, res) => {
  if (req.session["user_id"]) {
    // res.status(300)
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {

  if (req.session["user_id"]) {
    let templateVars = {
      urls: urlsForUser(urlDatabase, req.session["user_id"]),
      user: users[req.session["user_id"]]
    };
    res.render('urls_index', templateVars);
  } else {
    // res.send("Not signed in, go login or register");
    res.redirect("/login");
  }
});


app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: (req.session["user_id"]) ? users[req.session["user_id"]] : undefined,
  };
  if (req.session["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL:  urlDatabase[req.params.shortURL].longURL,
    user: (req.session["user_id"]) ? users[req.session["user_id"]] : undefined,
  };
  res.render('urls_show', templateVars);
});

app.get("/register", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: (req.session["user_id"]),
    };
    res.render('urls_register', templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.send('URL not found. Create a new one pls');
  }
});

app.get("/login", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session["user_id"]],
    };
    res.render('urls_login', templateVars);
  }
});


// --------------------------------------------------------------------------------
//                            DELETE PATHS
// --------------------------------------------------------------------------------

app.delete("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    if (req.session["user_id"] === urlDatabase[req.params.shortURL].userID) {
      delete urlDatabase[req.params.shortURL];
      res.redirect(`/urls`);
    } else {
      res.send("Not a url you can delete");
    }
  } else {
    res.send("URL cannot be deleted");
  }
});


// --------------------------------------------------------------------------------
//                            PUT PATHS
// --------------------------------------------------------------------------------

app.put("/login", (req, res) => {
  const usr = getUserByEmail(users, req.body.email);
  if (!usr) {
    res.status(403);
    res.send('Invalid email');
  } else if (bcrypt.compareSync(req.body.password, users[usr].password)) {
    req.session["user_id"] =  usr;
    res.redirect('/urls');
  } else {
    res.status(403);
    res.send('Invalid password');
  }
});

// PUT for creating a new link object in urlDatabase
app.put("/urls", (req, res) => {
  const newID = generateRandomString();
  urlDatabase[newID] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  };
  res.redirect(`/urls/${newID}`);
});

app.put("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send('Invalid email or password');
  } else if (getUserByEmail(users, req.body.email)) {
    res.status(400);
    res.send('Email already registered');
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password,10); //Salt rounds of 10
    const usr = new User(req.body.email, hashedPassword);
    users[usr.id] = usr;
    req.session["user_id"] =  usr.id;
    res.redirect('/urls');
  }
});


app.put("/urls/:shortURL", (req, res) => {
  if (req.session["user_id"] === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
    res.redirect(`/urls`);
  } else {
    res.send("Not a url you can edit");
  }
});

app.put("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});






// --------------------------------------------------------------------------------
//                                APP LISTENING
// --------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});