// function to lookup user-email
const getUserByEmail = function (email, database) {
  return Object.values(database).find((user) => user.email === email) || undefined;
};


module.exports = { getUserByEmail };