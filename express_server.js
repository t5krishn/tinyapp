// Express server for TinyApp
// Author: Thilina (@t5krishn)
// Main server file that should be run

// Modules required by server
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

// Helper functions from helper.js
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helper');

// Class Definition imports
const { User, URL } = require('./classes');

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


// --------------------------------------------------------------------------------
//                            DATABASES INITIALIZED
// --------------------------------------------------------------------------------


// Previous data structure of urlDatabase, left for reference if needed
// const urlDatabase = {
//   'b2xVn2': 'http://www.lighthouselabs.ca',
//   '9sm5xK': 'http://www.google.com'
// };

// New data structure of urlDatabase with userID's added
const urlDatabase = {
  sgq3y6: new URL('https://www.tsn.ca', 'aJ48lW'),
  i3BoGr: new URL('https://www.google.ca', 'aJ48lW'),
  as34aa: new URL('https://www.facebok.ca', 'asdasd'),
};


//USERs Database for storing all users registered
const users = {
  'aJ48lW': {
    id: 'aJ48lW',
    email: 'user@example.com',
    password: '$2b$10$jvJIrAiTCwNwMZCVT7D0rONFDB2jvQ/EtyI42AY.XbutcA5I429Ey' //purple-monkey-dinosaur
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2b$10$rfj/5wpPtMRpH2ZZ0VCZjO3e1eODRGP.QKKyv9kQPVB5hecwYkXDu'//dishwasher-funk
  }
};




//--------------------------------------------------------------------------------------//
//                             - ROUTES FOR TINYAPP -                                   //
//--------------------------------------------------------------------------------------//
//   - GET -         |      - POST -       |    - PUT -      |       - DELETE -         //
//-------------------|---------------------|-----------------|--------------------------//
//  /                |  /urls              |                 |                          //
//  /urls            |                     |                 |                          //
//  /urls/new        |  /logout            |                 |                          //
//  /urls/:shortURL  |  /urls/:shortURL    | /urls/:shortURL |  /urls/:shortURL/delete  //
//  /login           |  /login             |                 |                          //
//  /register        |  /register          |                 |                          //
//  /u/:shortURL     |                     |                 |                          //
//--------------------------------------------------------------------------------------//


// --------------------------------------------------------------------------------//
//                            GET PATHS                                            //
// --------------------------------------------------------------------------------//

app.get('/', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


app.get('/urls', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    let templateVars = {
      urls: urlsForUser(urlDatabase, req.session['user_id']),
      user: users[req.session['user_id']]
    };
    res.render('urls_index', templateVars);
  } else {
    let templateVars = {
      err : {
        title : "User Not Signed In",
        description : "Please sign in or register to access this page"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});


app.get('/urls/new', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    let templateVars = {
      user: users[req.session['user_id']],
    };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id']]) {
    if (urlDatabase[req.params.shortURL]) {
      if (req.session['user_id'] === urlDatabase[req.params.shortURL].userID) {
        let templateVars = {
          shortURL: req.params.shortURL,
          url:  urlDatabase[req.params.shortURL],
          user: users[req.session['user_id']],
        };
        res.render('urls_show', templateVars);
      } else {
        // USER DID NOT CREATE SO CANT GO TO EDIT PAGE
        let templateVars = {
          err : {
            title : "No Access to URL",
            description : "This URL is not created by you, please create one or try with one you have created"
          },
          user : undefined
        };
        res.render('error', templateVars);
      }
    } else {
      // URL IS NOT IN DATABASE
      let templateVars = {
        err : {
          title : "URL Not In Database",
          description : "This URL is not in our database, please create one or try with a different one"
        },
        user : undefined
      };
      res.render('error', templateVars);
    }
  } else {
    // USER IS NOT LOGGED IN
    let templateVars = {
      err : {
        title : "User Not Signed In",
        description : "Please sign in or register to access this page"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});


app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    if (req.session["visitor_id"]) {
      urlDatabase[req.params.shortURL].addVisit(req.session["visitor_id"], new Date());
      console.log("registered", urlDatabase[req.params.shortURL].visits.eachVisit);
      res.redirect(urlDatabase[req.params.shortURL].longURL);
    } else {
      const newID = generateRandomString();
      req.session["visitor_id"] = newID;
      urlDatabase[req.params.shortURL].addUnique(newID);
      urlDatabase[req.params.shortURL].addVisit(newID, new Date);
      console.log("new", urlDatabase[req.params.shortURL]);
      res.redirect(urlDatabase[req.params.shortURL].longURL);
    }
  } else {
    // URL NOT IN DATABASE
    let templateVars = {
      err : {
        title : "Invalid URL",
        description : "This URL is not in our database. Please create a new URL or try another"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});


app.get('/register', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: undefined,
    };
    res.render('urls_register', templateVars);
  }
});


app.get('/login', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user:undefined,
    };
    res.render('urls_login', templateVars);
  }
});


// --------------------------------------------------------------------------------//
//                            DELETE PATHS                                         //
// --------------------------------------------------------------------------------//

app.delete('/urls/:shortURL/delete', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    if (urlDatabase[req.params.shortURL]) {
      if (req.session['user_id'] === urlDatabase[req.params.shortURL].userID) {
        delete urlDatabase[req.params.shortURL];
        res.redirect(`/urls`);
      } else {
        // NOT YOUR URL TO DELETE
        let templateVars = {
          err : {
            title : "No Access to URL",
            description : "URL was created by another user. Cannot delete this URL."
          },
          user : undefined
        };
        res.render('error', templateVars);
      }
    } else {
      //URL DOES NOT EXIST
      let templateVars = {
        err : {
          title : "Invalid URL",
          description : "URL does not exist in our database, please try with another URL."
        },
        user : undefined
      };
      res.render('error', templateVars);
    }
  } else {
    // NOT LOGGED IN
    let templateVars = {
      err : {
        title : "User Not Signed In",
        description : "Please sign in or register to access this page"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});




// --------------------------------------------------------------------------------//
//                            PUT PATHS                                            //
// --------------------------------------------------------------------------------//

app.put('/urls/:shortURL', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    if (req.session['user_id'] === urlDatabase[req.params.shortURL].userID) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      res.redirect(`/urls`);
    } else {
      // USER CANNOT EDIT THIS URL
      let templateVars = {
        err : {
          title : "No Access to URL",
          description : "URL was created by another user. Cannot delete this URL."
        },
        user : undefined
      };
      res.render('error', templateVars);
    }
  } else {
    // user not signed in
    let templateVars = {
      err : {
        title : "User Not Signed In",
        description : "Please sign in or register to access this page"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});



// --------------------------------------------------------------------------------//
//                            POST PATHS                                           //
// --------------------------------------------------------------------------------//

app.post('/login', (req, res) => {
  const usr = getUserByEmail(users, req.body.email);
  if (!usr) {
    res.status(403);
    let templateVars = {
      err : {
        title : "Invalid Email",
        description : "Email is not present in our database. Try again or register a new account"
      },
      user : undefined
    };
    res.render('error', templateVars);
  } else if (bcrypt.compareSync(req.body.password, users[usr].password)) {
    req.session['user_id'] =  usr;
    res.redirect('/urls');
  } else {
    res.status(403);
    let templateVars = {
      err : {
        title : "Invalid Password",
        description : "Password is incorrect. Try again"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});

// POST for creating a new link object in urlDatabase
app.post('/urls', (req, res) => {
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    const newID = generateRandomString();
    urlDatabase[newID] = new URL(req.body.longURL, req.session['user_id']);
    res.redirect(`/urls/${newID}`);
  } else {
    // NOT SIGNED IN, CANNOT CREATE NEW URLS
    let templateVars = {
      err : {
        title : "User Not Signed In",
        description : "Please sign in or register to access this page"
      },
      user : undefined
    };
    res.render('error', templateVars);
  }
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    let templateVars = {
      err : {
        title : "Invaid Input",
        description : "Email or password is invalid. Try again."
      },
      user : undefined
    };
    res.render('error', templateVars);
  } else if (getUserByEmail(users, req.body.email)) {
    res.status(400);
    let templateVars = {
      err : {
        title : "Invalid Email",
        description : "Email is already in our database. Login or register another account."
      },
      user : undefined
    };
    res.render('error', templateVars);
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password,10); //Salt rounds of 10
    const usr = new User(req.body.email, hashedPassword);
    users[usr.id] = usr;
    req.session['user_id'] =  usr.id;
    res.redirect('/urls');
  }
});


app.post('/logout', (req, res) => {
  req.session["user_id"] = null;
  res.redirect('/urls');
});

// --------------------------------------------------------------------------------
//                                APP LISTENING
// --------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
