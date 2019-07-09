const inUser = function(users, email) {
  for (user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
};

module.exports = inUser;