const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

const bcrypt = require('bcryptjs');

const { findUserByEmail } = require('./helpers.js');


//User Storage


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.youtube.ca",
    userId: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userId: "user2RandomID",
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "a@a.com",
    password: "123",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "b@b.com",
    password: "123",
  }
};



//Helper Functions


function generateRandomString() {
  return Math.random().toString(36).slice(-6);
}

function generateRandomID() {
  return Math.floor(Math.random() * 2000) + 1;
}


const urlsForUser = (id) => {
  const filteredDatabase = { };
  const shortURLs = Object.keys(urlDatabase);

  shortURLs.forEach((shortURL) => {
    const foundRecord = urlDatabase[shortURL];

    if (foundRecord.userId === id) {
      filteredDatabase[shortURL] = foundRecord;
    }
  });
  return filteredDatabase;
};


const rejectUnauthenticatedUser = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return true;
  }
};


const rejectUnauthorisedUser = (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.userId;
  const foundRecord = urlDatabase[shortURL];

  if (!foundRecord || foundRecord.userId !== userId) {
    return true;
  }

  if (userId !== foundRecord.userId) {
    return true;
  }
};



//-----------------------------------GETS------------------------------------//

//MAIN PAGE
app.get("/", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.redirect("/login");
  }

  return res.redirect("/urls");
});


//URL DATABASE
app.get("/urls.json", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.redirect("/login");
  }
  return res.json(urlsForUser(req.session.userId));
});


//URLS INDEX PAGE
app.get("/urls", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.send("<html><body>401 Unauthorized - Please login first</b></body></html>\n");
  }

  const userId = req.session.userId;
  const templateVars = { urls: urlsForUser(userId), user: users[userId] };

  return res.render("urls_index", templateVars);
});


//URLS NEW PAGE
app.get("/urls/new", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.redirect("/login");
  }

  const currentUser = users[req.session.userId];
  const templateVars = { user: currentUser };

  return res.render("urls_new", templateVars);
});


//URLS SHOW PAGE
//(in Compass, this is sometimes referred to as /urls/:id)
app.get("/urls/:shortURL", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.send('<html><body>You must be logged in to view this page.</b></body></html>\n');
  }

  if (rejectUnauthorisedUser(req, res)) {
    return res.send('<html><body>You are not authorised to view this content.</b></body></html>\n');
  }

  const shortURL = req.params.shortURL;
  const foundRecord = urlsForUser(req.session.userId);

  if (!foundRecord || !foundRecord[shortURL]) {
    return res.send(`<html><body>Unable to find a record with short URL ${shortURL}.</b></body></html>\n`);
  }

  const templateVars = {
    shortURL,
    longURL: foundRecord[shortURL].longURL,
    user: users[req.session.userId],
  };

  return res.render("urls_show", templateVars);
});

//REDIRECTS u/:shortURL TO longURL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send(`<html><body>Unable to find a record with short URL ${req.params.shortURL}.</b></body></html>\n`);
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;

  return res.redirect(longURL);
});


//REDIRECTS urls/:shortURL/edit TO urls/shortURL
app.get("/urls/:shortURL/edit", (req, res) => {
  if (!rejectUnauthenticatedUser(req, res) && !rejectUnauthorisedUser(req, res)) {

    const shortURL = req.params.shortURL;

    return res.redirect(`/urls/${shortURL}`);
  }
});


//REGISTRATION PAGE
app.get("/register", (req, res) => {
  if (!rejectUnauthenticatedUser(req, res)) {
    res.redirect('/urls');
  }

  const templateVars = { user: users[req.session.userId]  };
  return res.render("registration", templateVars);
});


//LOGIN FORM PAGE
app.get("/login", (req, res) => {
  if (!rejectUnauthenticatedUser(req, res)) {
    res.redirect('/urls');
  }
  const templateVars = { user: users[req.session.userId]  };
  return res.render("login_form", templateVars);
});



//-----------------------------------POSTS-----------------------------------//


//CREATES SHORT URL
app.post("/urls", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.send('<html><body>You must be logged in to view this page.</b></body></html>\n');
  }

  const shortURL = generateRandomString();
  const newDatabaseEntry = {
    longURL: req.body.longURL,
    userId: req.session.userId,
  };
  urlDatabase[shortURL] = newDatabaseEntry;

  return res.redirect(`/urls/${shortURL}`);
});


//DELETES RECORD
app.post("/urls/:shortURL/delete", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.send('<html><body>You must be logged in to perform this operation.</b></body></html>\n');
  }

  if (rejectUnauthorisedUser(req, res)) {
    return res.send('<html><body>You are not authorised to perform this operation.</b></body></html>\n');
  }

  const shortURL = req.params.shortURL;

  delete urlDatabase[shortURL];

  return res.redirect('/urls/');
});


//EDITS longURL
app.post("/urls/:shortURL", (req, res) => {
  if (rejectUnauthenticatedUser(req, res)) {
    return res.send('<html><body>You must be logged in to view this page.</b></body></html>\n');
  }

  if (rejectUnauthorisedUser(req, res)) {
    return res.send('<html><body>You are not authorised to view this content.</b></body></html>\n');
  }

  const shortURL = req.params.shortURL;

  urlDatabase[shortURL].longURL = req.body.longURL;

  return res.redirect('/urls');
});


//LOGIN USER
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);


  if (email === "" || password === "") {
    return res.send('<html><body>404 Error. Email and/or Password was blank.</b></body></html>\n');
  }

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.send('<html><body>403 error</b></body></html>\n');
  }

  req.session.userId = user.id;

  return res.redirect('/urls');

});


//LOGOUT USER
app.post("/logout", (req, res) => {
  req.session = null;

  return res.redirect('/urls');
});


//REGISTER USER
app.post("/register", (req, res) => {
  const id = generateRandomID();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = findUserByEmail(email, users);

  if (email === "" || password === "") {
    return res.send('<html><body>404 Error. Email and/or Password was blank.</b></body></html>\n');
  }

  if (user) {
    return res.send('<html><body>404 Error. Email is already in use.</b></body></html>\n');
  }

  if (!user) {
    const user = id;

    const newUser = {
      id,
      email,
      password: hashedPassword,
    };

    users[id] = newUser;

    req.session.userId = user.id;

    return res.redirect('/urls');
  }
});



//-------------------------------MISCELLANEOUS-------------------------------//


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});