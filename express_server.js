const { request } = require('express');
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

// function to generate random short URL
function generateRandomString() {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// set view engine to EJS
app.set('view engine', 'ejs');

// store short-URL / long-URL pairs
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

// route handler login form submission
app.post('/login', (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
  res.redirect('/urls');
});

// route handler to serve URL database as JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// route handler to display short URLS
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// route hanlder to display form + create new short URLs
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// route handler to display details for short URL
app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id, longURL };
  res.render('urls_show', templateVars);
});

// route handler to create new short URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// route handler to redirect shortURL to its longURL
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// route handler to delete short URL
app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// route handler to update longURL for a shortURL
app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
});

// start server and listen for PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
