// function to lookup user-email
const getUserByEmail = function (email, database) {
  return Object.values(database).find((user) => user.email === email) || undefined;
};

// function to generate random short URL
const generateRandomString = function () {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const resultArr = [];

  for (let i = 0; i < 6;) {
    resultArr.push(characters.charAt(Math.floor(Math.random() * characters.length)));
    i = resultArr.length;
  }

  return resultArr.join('');
};

// function to return userURLs
const urlsForUser = function (id, urlDatabase) {
  if (!urlDatabase) {
    return {};
  }
  const userUrls = {};
  const urls = Object.entries(urlDatabase);

  urls.forEach(([shortURL, url]) => {
    if (url.userID === id) {
      userUrls[shortURL] = {
        longURL: url.longURL,
        userID: url.userID,
      };
    }
  });

  return userUrls;
};


// function redirect logged in users
const users = require('./express_server');

const redirectLoggedIn = function (req, res, next) {
  const userId = req.session.user_id;
  const user = users[userId];
  if (user) {
    res.redirect('/urls');
  } else {
    next();
  }
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser, redirectLoggedIn, };
