/* eslint-disable func-style */

// Add bcrypt to encrypt our data.
const bcrypt = require("bcryptjs");

// Initiate our express server
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieSession = require('cookie-session');
app.use(cookieSession({name: 'session', secret: '4inchorangedoorhinge'}));

// Set our render engine
app.set("view engine", "ejs");

// Convert our requests into a readable string
app.use(express.urlencoded({ extended: true }));

// Declare our ids with urls
const urlDatabase = {};

// Our users object
const users = {};

function generateRandomString(len) {
  let text = "";
  
  let charset = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789";
  
  for (let i = 0; i < len; i++)
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  
  return text;
}

function getUserByEmail(email) {
  for (usr in users) {
    if (email == users[usr].email) {
      return usr;
    }
  }
  return false;
}

// Helps us easily find a user's URLs
function urlsForUser(id) {
  let userURLs = {};
  for (url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userURLs[url] = urlDatabase[url].longURL;
    }
  }
  return userURLs;
}

// Visiting our web server's / will greet with hello
app.get("/", (req, res) => {
  res.send("Hello!");
  console.log(getUserByEmail("user@example.com"));
});

// Log our port to console
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// urls.json returns a json object from our urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// We use ejs to render our hello_world.ejs template and greet the viewer
app.get("/hello", (req, res) => {
  const templateVars = {
    greeting: "Hello World!",
    user: users[req.session.userID]
  };
  res.render("hello_world", templateVars);
});

// Displays a table of our ids and urls using our urls_index.ejs template
app.get("/urls", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("You must be logged in");
  } else {
    const templateVars = {
      user: users[req.session.userID],
      urls: urlsForUser(req.session.userID)
    };
    res.render("urls_index", templateVars);
    console.log(urlDatabase);
  }
});

// Accept post data on our urls endpoint
app.post("/urls", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("You must be logged in to create tiny URL.");
  } else {
    let shortURL = generateRandomString(6);
    // Add our new tiny URL with userID attached
    urlDatabase[shortURL] = {
      longURL : req.body.longURL,
      userID: req.session.userID
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// A route to create new urls
app.get("/urls/new", (req, res) => {
  if (!req.session.userID) {
    res.redirect('/login');
  } else {
    const templateVars = {
      user: users[req.session.userID]
    };
    res.render("urls_new", templateVars);
  }
});

// Visiting urls with urls/id returns it's longurl and renders it from our urls_show.ejs template
app.get("/urls/:id", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("You must be logged in to update tiny URL.");
  } else {
    if (!urlDatabase[req.params.id]) {
      res.status(404).send("URL not found.");
    } else {
      if (req.session.userID === urlDatabase[req.params.id].userID) {
        const templateVars = {
          id: req.params.id,
          longURL: urlDatabase[req.params.id].longURL,
          user: users[req.session.userID]
        };
        res.render("urls_show", templateVars);
      } else {
        res.status(404).send("You do not have permission to view this URL");
      }
    }
  }
});

// Update longURL in urlDatabase. User must be logged in and have permission to update. Also checks if the url exists.
app.post("/urls/:id", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("You must be logged in to update tiny URL.");
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send("URL not found.");
  } else {
    if (req.session.userID === urlDatabase[req.params.id].userID) {
      urlDatabase[req.params.id].longURL = req.body.newURL;
      res.redirect("/urls");
    } else {
      res.status(403).send("You do not have permission to update this URL.");
    }
  }
});

// Delete url from urlDatabase. User must be logged in and have permission to delete. Also checks if the url exists.
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("You must be logged in to delete tiny URL.");
  } else if (!urlDatabase[req.params.id]) {
    res.status(404).send("URL not found.");
  } else {
    if (req.session.userID === urlDatabase[req.params.id].userID) {
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
    } else {
      res.status(403).send("You do not have permission to delete this URL.");
    }
  }
});

// Redirect any requests to a URL id to its longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Endpoint for logging in. Redirects to urls if already signed in.
app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.userID]
    };
    res.render("user_login", templateVars);
  }
});

// Endpoint for logging in. Also sets a cookie for userID
app.post("/login", (req, res) => {
  // Email and password are not empty
  if (req.body.email || req.body.password) {
    const userEmail = req.body.email;
    const userPassword = req.body.password;
    if (!getUserByEmail(req.body.email)) { // Email was not found in users database.
      res.status(400).send("400 error ! Error finding user");
    } else { // User exists and needs to be authenticated.
      const userObject = users[getUserByEmail(req.body.email)];
      if (userEmail === userObject.email && bcrypt.compareSync(userPassword, userObject.password)) {
        // User is authenticated, set cookie and redirect to their /urls
        req.session.userID = userObject.id;
        res.redirect('/urls');
      }
    }
  } else {
    res.status(400).send("400 error ! Email or password empty.");
  }
});

// Endpoint for logging out. Redirect to /login
app.post("/logout", (req, res) => {
  // Two cookies are created, so we must clear both to properly log out
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect('/login');
});

// Endpoint for registration. If already logged in, redirect to urls
app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.userID]
    };
    res.render("user_registration", templateVars);
  }
});

// Endpoint registers and logs a user in. Redirect to /urls if successful.
app.post("/register", (req, res) => {
  if (req.body.email || req.body.password) {
    if (getUserByEmail(req.body.email)) {
      res.status(403).send("403 error ! Email already registered.");
    } else {
      const userId = generateRandomString(12);
      users[userId] = {
        id: userId,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.userID = userId;
      res.redirect("/urls");
    }
  } else {
    res.status(403).send("403 error ! Email or password is not valid");
  }

});
