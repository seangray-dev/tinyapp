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

// function to lookup user-email
function getUserByEmail(email, users) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  const userId = req.cookies.userId;
  const user = users[userId];
  req.user = user;
  next();
});

// set view engine to EJS
app.set('view engine', 'ejs');

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};

// store short-URL / long-URL pairs
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};

// route handler to display register page
app.get('/register', (req, res) => {
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
    password,
  };

  users[userId] = newUser;
  res.cookie('userId', userId);
  res.redirect('/urls');
});

// route handler to display login page
app.get('/login', (req, res) => {
  const templateVars = { user: req.user };
  res.render('login', templateVars);
});

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
  }

  if (user.password !== password) {
    res.status(403).send('Incorrect password');
    return;
  }

  res.cookie('userId', user.id);
  res.redirect('/urls');
});

// route handler for logout
app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.redirect('/login');
});

// route handler to serve URL database as JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// route handler to display short URLS
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, user: req.user };
  res.render('urls_index', templateVars);
});

// route hanlder to display form + create new short URLs
app.get('/urls/new', (req, res) => {
  const templateVars = { user: req.user || '' };
  res.render('urls_new', templateVars);
});

// route handler to display details for short URL
app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id, longURL, user: req.user };
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
