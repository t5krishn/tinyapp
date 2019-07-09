const inUser = function(users, email) {
  for (user in users) {
    if (user.email === email) {
      return true
    }
  }
  return false;
};

module.exports = inUser;