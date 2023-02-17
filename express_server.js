// Initiate our express server
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {}

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
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Visiting urls with urls/id returns it's longurl and renders it from our urls_show.ejs template
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// Redirect any requests to a URL id to its longURL
app.get("/u/:id", (req, res) => {
  // const longURL = ...
  res.redirect(longURL);
});
