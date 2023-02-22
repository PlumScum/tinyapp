var cookieParser = require('cookie-parser');
const e = require('express');

// Initiate our express server
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString(len) {
  let text = "";
  
  let charset = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789";
  
  for (let i = 0; i < len; i++)
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  
  return text;
}

// Set our render engine
app.set("view engine", "ejs");

// Convert our requests into a readable string
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Declare our ids with urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Our users object
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function getUserByEmail(email) {
  for (usr in users) {
    if (email == users[usr].email) {
      return usr;
    }
  }
  return false;
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
    user: users[req.cookies["user_id"]]
  };
  res.render("hello_world", templateVars);
});

// Displays a table of our ids and urls using our urls_index.ejs template
app.get("/urls", (req, res) => {

  const templateVars = {
    user: users[req.cookies["user_id"]],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Accept post data on our urls endpoint
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("You must be logged in to update tiny URL.");
  } else {
    let shortURL = generateRandomString(6);
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

// A route to create new urls
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect('/login');
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_new", templateVars);
  }
});

// Visiting urls with urls/id returns it's longurl and renders it from our urls_show.ejs template
app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("You must be logged in to update tiny URL.");
  } else {
    if (!urlDatabase[req.params.id]) {
      res.status(404).send("URL not found.");
    } else {
      const templateVars = {
        id: req.params.id,
        longURL: urlDatabase[req.params.id],
        user: users[req.cookies["user_id"]]
      };
      res.render("urls_show", templateVars);
    }
  }
});

// Update longURL in urlDatabase
app.post("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("You must be logged in to update tiny URL.");
  } else {
    urlDatabase[req.params.id] = req.body.newURL;
    res.redirect("/urls");
  }
});

// Delete url from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("You must be logged in to delete tiny URL.");
  } else {
    // Since we are not sending post data, we are using the req.param.id to get its id
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

// Redirect any requests to a URL id to its longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Endpoint for logging in.
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("user_login", templateVars);
  }
});

// Endpoint for logging in. Also sets a cookie for user_id
app.post("/login", (req, res) => {
  // Are any of our login credentials empty?
  if (req.body.email || req.body.password) {
    const userEmail = req.body.email;
    const userPassword = req.body.password;
    if (!getUserByEmail(req.body.email)) {
      res.status(400).send("400 error ! Error finding user");
    } else {
      const userObject = users[getUserByEmail(req.body.email)];
      if (userEmail === userObject.email && userPassword === userObject.password) {
        res.cookie('user_id', userObject.id);
        res.redirect('/urls');
      }
    }
  } else {
    res.status(400).send("400 error ! Email or password empty.");
  }
});

// Endpoint for logging out.
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Endpoint for registration.
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("user_registration", templateVars);
  }
});

// Endpoint registers and logs a user in.
app.post("/register", (req, res) => {
  if (req.body.email || req.body.password) {
    if (getUserByEmail(req.body.email)) {
      res.status(403).send("403 error ! Email already registered.");
    } else {
      const userId = generateRandomString(12);
      users[userId] = {
        id: userId,
        email: req.body.email,
        password: req.body.password
      };
      res.cookie('user_id', userId);
      res.redirect("/urls");
    }
  } else {
    res.status(403).send("403 error ! Email or password is not valid");
  }

});
