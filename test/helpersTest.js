const { assert } = require('chai');
const { getUserByEmail, generateRandomString, urlsForUser } = require('../helpers.js');


const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined with a non-existent email', function() {
    const user = getUserByEmail("user3@example.com", testUsers)
    assert.isUndefined(user);
  });
});

describe('generateRandomString', function() {
  it('should return a string with a length of 6', function() {
    const randomString = generateRandomString();
    assert.strictEqual(randomString.length, 6);
  });

  it('should return a different string each time it is called', function() {
    const randomString1 = generateRandomString();
    const randomString2 = generateRandomString();
    assert.notStrictEqual(randomString1, randomString2);
  });
});

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
  "abc123": {
    longURL: "http://www.example.com",
    userID: "userRandomID"
  }
};

describe('urlsForUser', function() {
  it('should return an empty object for a user with no URLs', function() {
    const userUrls = urlsForUser("user3RandomID", testUrlDatabase);
    const expectedOutput = {};
    assert.deepEqual(userUrls, expectedOutput);
  });

  it('should return an object of URLs for a user with URLs', function() {
    const userUrls = urlsForUser("userRandomID", testUrlDatabase);
    const expectedOutput = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "userRandomID"
      },
      "abc123": {
        longURL: "http://www.example.com",
        userID: "userRandomID"
      }
    };
    assert.deepEqual(userUrls, expectedOutput);
  });

  it('should return an empty object for a non-existent user', function() {
    const userUrls = urlsForUser("user4RandomID", testUrlDatabase);
    const expectedOutput = {};
    assert.deepEqual(userUrls, expectedOutput);
  });
});