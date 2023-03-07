const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
  redirectLoggedIn,
} = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

const users = {};
const urlDatabase = {};

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.use((req, res, next) => {
  const userId = req.session.user_id;
  const user = users[userId];
  req.user = user;
  next();
});
app.use(methodOverride('_method'));

// set view engine to EJS
app.set('view engine', 'ejs');

// route handler for home page
app.get('/', (req, res) => {
  if (req.user) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// route handler to display register page
app.get('/register', redirectLoggedIn, (req, res) => {
  const templateVars = { user: req.user || '' };
  res.render('register', templateVars);
});

// route handler for registration
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are empty
  if (!email || !password) {
    res.status(400).send('Email or password cannot be empty');
    return;
  }

  // Check if email already exists in users object
  if (getUserByEmail(email, users)) {
    res.status(400).send('Email already exists');
    return;
  }

  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, 10),
  };

  users[userId] = newUser;
  req.session.user_id = newUser.id;
  res.redirect('/urls');
});

// route handler to display login page
app.get('/login', redirectLoggedIn, (req, res) => {
  const templateVars = { user: req.user };
  res.render('login', templateVars);
});

// route handler for login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).send('Email cannot be empty');
    return;
  }

  if (!password) {
    res.status(400).send('Password cannot be empty');
    return;
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    res.status(403).send('Email does not exist');
    return;
  }

  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send('Incorrect password');
    return;
  }

  req.session.user_id = user.id;
  res.redirect('/urls');
});

// route handler for logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// route handler to serve URL database as JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// route handler to display short URLS
app.get('/urls', (req, res) => {
  if (!req.user) {
    const templateVars = {
      user: req.user,
      error: 'Please log in or register to see your URLs.',
    };
    res.status(401).render('login', templateVars);
    return;
  }

  const userUrls = urlsForUser(req.user.id, urlDatabase);
  const templateVars = { urls: userUrls, user: req.user };
  res.render('urls_index', templateVars);
});

// route hanlder to display form + create new short URLs
app.get('/urls/new', (req, res) => {
  if (!req.user) {
    res.redirect('/login');
  } else {
    const templateVars = { user: req.user || '' };
    res.render('urls_new', templateVars);
  }
});

// route handler to create new short URL
app.post('/urls', ({ body: { longURL }, user }, res) => {
  if (!user) {
    return res.status(401).send('You must be logged in to create short URLs');
  }

  const shortURL = generateRandomString();
  const userID = user.id;

  urlDatabase[shortURL] = { longURL, userID };
  return res.redirect(`/urls/${shortURL}`);
});

// route handler to display details for short URL
app.get('/urls/:id', (req, res) => {
  const { id } = req.params;
  const url = urlDatabase[id];
  const { uniqueVisits } = url;
  const { visitors } = url;

  // check if user is logged in
  if (!req.user) {
    res.status(401).send('Please login to view this URL');
    return;
  }

  // check if url exists
  if (!url) {
    res.status(404).send('URL not found');
    return;
  }

  // if current user does not own this url, send an error
  if (url.userID !== req.user.id) {
    res.status(403).send('You do not have permission to view this URL');
    return;
  }

  const templateVars = {
    id,
    longURL: url.longURL,
    visitCount: url.visits,
    uniqueVisits,
    user: req.user,
    urlDatabase,
    visitors,
  };

  res.render('urls_show', templateVars);
});

// route handler to redirect shortURL to its longURL
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  // check if url exists
  if (!url) {
    res.status(404).send('URL not found');
    return;
  }

  // if current user does not own this url, send an error
  if (req.user && url.userID !== req.user.id) {
    res.status(403).send('You do not have permission to view this URL');
    return;
  }

  // increment visit count for url
  url.visits = url.visits ? url.visits + 1 : 1;

  const cookie = `url_${shortURL}`;

  // check if there are any visitors, if not create an array
  if (!url.visitors) {
    url.visitors = [];
  }

  // check if the user has a cookie for URL
  if (!req.session[cookie]) {
    // set cookie if they dont
    req.session[cookie] = generateRandomString();
    // increment uniqueVisits
    url.uniqueVisits = url.uniqueVisits ? url.uniqueVisits + 1 : 1;
    const visitorId = req.session[cookie];
    const timestamp = new Date();
    // add new visitor to visitors array
    url.visitors.push({ visitorId, timestamp });
  } else {
    const visitorId = req.session[cookie];
    const timestamp = new Date();
    url.visitors.push({ visitorId, timestamp });
  }

  res.redirect(url.longURL);
});

// route handler to delete short URL
app.delete('/urls/:id/delete', (req, res) => {
  const { id } = req.params;

  // Check if the URL with the given ID exists
  if (!urlDatabase[id]) {
    res.status(404).send('URL not found');
    return;
  }

  // Check if the user is logged in
  if (!req.user) {
    res.status(401).send('You must be logged in to delete URLs');
    return;
  }

  // Check if the user owns the URL they are trying to delete
  if (urlDatabase[id].userID !== req.user.id) {
    res.status(403).send('You do not have permission to delete this URL');
    return;
  }

  delete urlDatabase[id];
  res.redirect('/urls');
});

// route handler to update longURL for a shortURL
app.put('/urls/:id', (req, res) => {
  const { id } = req.params;
  const newLongURL = req.body.longURL;

  // Check if the URL with the given ID exists
  if (!urlDatabase[id]) {
    res.status(404).send('URL not found');
    return;
  }

  // Check if the user is logged in
  if (!req.user) {
    res.status(401).send('You must be logged in to edit URLs');
    return;
  }

  // Check if the user owns the URL they are trying to edit
  if (urlDatabase[id].userID !== req.user.id) {
    res.status(403).send('You do not have permission to edit this URL');
    return;
  }

  urlDatabase[id].longURL = newLongURL;
  res.redirect('/urls');
});

// start server and listen for PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

module.exports = { users };
