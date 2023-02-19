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

// Declare our ids with urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Visiting our web server's / will greet with hello
app.get("/", (req, res) => {
  res.send("Hello!");
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
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

// Displays a table of our ids and urls using our urls_index.ejs template
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Accept post data on our urls endpoint
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// A route to create new urls
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Visiting urls with urls/id returns it's longurl and renders it from our urls_show.ejs template
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// Update longURL in urlDatabase
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls");
});

// Delete url from urlDatabase
app.post("/urls/:id/delete", (req, res) => {
  // Since we are not sending post data, we are using the req.param.id to get its id
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Redirect any requests to a URL id to its longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});
