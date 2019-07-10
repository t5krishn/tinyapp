// Express server for TinyApp
// Author: Thilina (@t5krishn)
// Main server file that should be run

// Modules required by server
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require("bcrypt");

// Helper functions from helper.js
const { inUser, urlsForUser, generateRandomString } = require('./helper');

// Initializing app with port
const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');

// Middleware to parse request.body and request.cookies
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Previous data structure of urlDatabase, left for reference if needed
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

// Class used to create URLS
class URL {

};

// New data structure of urlDatabase with userID's added
const urlDatabase = {
  sgq3y6: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// Class used to create new Users
class User {
  constructor(email, password){
    this.id = generateRandomString();
    this.email = email;
    this.password = password;
  }
};


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
//         - GET -            |           - POST -          //
//----------------------------|-----------------------------//
//        /                   |    /urls                    //
//        /urls               |    /urls/:shortURL/delete   //
//        /urls/new           |    /logout                  //
//        /urls/:shortURL     |    /urls/:shortURL          //
//        /login              |    /login                   //
//        /register           |    /register                //
//        /u/:shortURL        |-----------------------------//
//----------------------------------------------------------//


app.get("/", (req, res) => {
  if (req.cookies["user_id"]) {  
    // res.status(300)
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});



// This will show all users and their associated urls, not sure if it should be shown
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {

  if (req.cookies["user_id"]) {
    let templateVars = {
      urls: urlsForUser(urlDatabase, req.cookies["user_id"]),
      user: users[req.cookies["user_id"]]
    };
    res.render('urls_index', templateVars);
  } else {
    // res.send("Not signed in, go login or register");
    res.redirect("/login");
  }  
});



app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: (req.cookies["user_id"])? users[req.cookies["user_id"]] : undefined,
  };
  if (req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    // urls: urlsForUser(urlDatabase, req.cookies["user_id"]),
    longURL:  urlDatabase[req.params.shortURL].longURL,
    user: (req.cookies["user_id"])? users[req.cookies["user_id"]] : undefined,
  };
  res.render('urls_show', templateVars);
});

// POST for creating a new link object in urlDatabase
app.post("/urls", (req, res) => {
  // console.log(req.body.longURL);
  const newID = generateRandomString();
  console.log(req.body.longURL);
  urlDatabase[newID] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  }
  res.redirect(`/urls/${newID}`);
});

app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.send('URL not found. Create a new one pls');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
      delete urlDatabase[req.params.shortURL];
      res.redirect(`/urls`);
    } else {
      res.send("Not a url you can delete");
    }
  } else {
    res.send("URL cannot be deleted");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
    res.redirect(`/urls`);
  } else {
    res.send("Not a url you can edit");
  }
});

app.post("/login", (req, res) => {
  const usr = inUser(users, req.body.email)
  if (!usr) {
    res.status(403);
    res.send('Invalid email');
  } else if (!bcrypt.compareSync(req.body.password, users[usr].password)) {
    res.status(403);
    res.send('Invalid password');
  } else {
    res.cookie("user_id", usr);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: (req.cookies["user_id"])? users[req.cookies["user_id"]] : undefined,
  };
  res.render('urls_register', templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.send('Invalid email or password');
  } else if (inUser(users, req.body.email)) {
    res.status(400);
    res.send('Email already registered');
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password,10) //Salt rounds of 10 
    const usr = new User (req.body.email, hashedPassword);
    users[usr.id] = usr;
    res.cookie("user_id", usr.id);
    res.redirect('/urls');
    console.log(users);
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: (req.cookies["user_id"])? users[req.cookies["user_id"]] : undefined,
  };
  res.render('urls_login', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});