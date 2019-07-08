const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080; // default port 8080

// set the view engine to ejs
app.set('view engine', 'ejs');


const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
}

app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  let templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {shortURL: req.params.shortURL, longURL:  urlDatabase[req.params.shortURL]};
  res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body.longURL);
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


