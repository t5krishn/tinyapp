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

// Class Definition imports from classes.js
const { User, URL } = require('./classes');

// Initializing app with port
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

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

// Gets main display path
app.get('/', (req, res) => {
  // Checks if user is logged in
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// Gets urls_index page
app.get('/urls', (req, res) => {
  // Checks if user is logged in
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

// Gets display page for creating a new URL
app.get('/urls/new', (req, res) => {
  // Checks if user is logged in
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    let templateVars = {
      user: users[req.session['user_id']],
    };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// Gets display page for a specific url
app.get('/urls/:shortURL', (req, res) => {
  // Checks if user is logged in
  if (req.session['user_id'] && users[req.session['user_id']]) {
    // Checks if url is in database
    if (urlDatabase[req.params.shortURL]) {
      // Checks if the url was created by logged in user
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
            description : "This URL is not created by you, please create one or try with one you have created",
          },
          user: users[req.session['user_id']]

        };
        res.render('error', templateVars);
      }
    } else {
      // URL IS NOT IN DATABASE
      let templateVars = {
        err : {
          title : "URL Not In Database",
          description : "This URL is not in our database, please create one or try with a different one",
        },
        user: users[req.session['user_id']]
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

// Redirecting from short url to long url
app.get('/u/:shortURL', (req, res) => {
  // Checks if url exists in urldatabase
  if (urlDatabase[req.params.shortURL]) {
    // Checks if a visitor cookie exists
    if (req.session["visitor_id"]) {
      // Checks if the url has the visitor id in it or not
      if (urlDatabase[req.params.shortURL].visits.uniqueVisitors.includes(req.session["visitor_id"])) {
        urlDatabase[req.params.shortURL].addVisit(req.session["visitor_id"], new Date());
        res.redirect(urlDatabase[req.params.shortURL].longURL);
      } else {
        // Visitor id is not present in unique visitors in the url
        urlDatabase[req.params.shortURL].addVisit(req.session["visitor_id"], new Date());
        urlDatabase[req.params.shortURL].addUnique(req.session["visitor_id"]);
        res.redirect(urlDatabase[req.params.shortURL].longURL);
      }
    } else {
      // Visitor cookie does not exist so create one and set it
      const newID = generateRandomString();
      req.session["visitor_id"] = newID;
      urlDatabase[req.params.shortURL].addUnique(newID);
      urlDatabase[req.params.shortURL].addVisit(newID, new Date);
      res.redirect(urlDatabase[req.params.shortURL].longURL);
    }
  } else {
    // URL NOT IN DATABASE
    let templateVars = {
      err : {
        title : "Invalid URL",
        description : "This URL is not in our database. Please create a new URL or try another"
      },
      user: (req.session['user_id']) ? users[req.session['user_id']] : undefined
    };
    res.render('error', templateVars);
  }
});

// Displays the register page
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

// Displays the login page
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

// Deletes a url, using method-override
app.delete('/urls/:shortURL/delete', (req, res) => {
  // Checks if the user is logged in to delete
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    // Checks if the url exists in the database
    if (urlDatabase[req.params.shortURL]) {
      // Checks if the url was created by user that is signed in
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
          user: users[req.session['user_id']]
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
        user : users[req.session['user_id']] 
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

// PUT method used to update an existing url record
app.put('/urls/:shortURL', (req, res) => {
  // Checks if the user is logged in
  if (req.session['user_id'] && users[req.session['user_id'] ]) {
    // Checks if the url that user tries to edit was created by logged in user
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
        user : users[req.session['user_id']] 

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

// POST method for logging in 
app.post('/login', (req, res) => {
  const usr = getUserByEmail(users, req.body.email);
  // If useremail is in database, return if, if not return false
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
    // Checks if the passwords are the same
    req.session['user_id'] =  usr;
    res.redirect('/urls');
  } else {
    //  If password is not the same as one stored in database
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
  // Checks if user is logged in or not
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

// PUT method to register a new user
app.post('/register', (req, res) => {
  // Email or password fields given an emptry string
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
    // Checks if email entered is already in database, returns true means it already exists so
    //    - throw an error
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
    // No empty string nor email already present
    const hashedPassword = bcrypt.hashSync(req.body.password,10); //Salt rounds of 10
    const usr = new User(req.body.email, hashedPassword);
    users[usr.id] = usr;
    req.session['user_id'] =  usr.id;
    res.redirect('/urls');
  }
});

// Logs out user
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
