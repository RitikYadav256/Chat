const users = require('./users');

function authenticate(username, password) {
  const user = users[username];
  return user && user.password === password;
}

module.exports = { authenticate };
