const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')

const inUser = require('./helper/inUser');

const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');


const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

class User {
  constructor(email, password){
    this.id = generateRandomString();
    this.email = email;
    this.password = password;
  }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  // console.log(users[req.cookies["user_id"]]);
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: (req.cookies)? users[req.cookies["user_id"]] : undefined,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL:  urlDatabase[req.params.shortURL],
    user: (req.cookies)? users[req.cookies["user_id"]] : undefined,
  };
  res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body.longURL);
  const newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`/urls/${newID}`);
});

app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL]){
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.send('URL not found. Create a new one pls');
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const usr = inUser(users, req.body.email)
  // console.log(users[usr);
  // console.log(req.body.password);
  if (!usr) {
    res.status(403);
    res.send('Invalid email');
  } else if (users[usr].password !== req.body.password) {
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
    user: (req.cookies)? users[req.cookies["user_id"]] : undefined,
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
    const usr = new User (req.body.email, req.body.password);
    users[usr.id] = usr;
    res.cookie("user_id", usr.id);
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: (req.cookies)? users[req.cookies["user_id"]] : undefined,
  };
  res.render('urls_login', templateVars);
});