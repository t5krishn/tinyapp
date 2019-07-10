const inUser = function(users, email) {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return false;
};


const urlsForUser = function(urlDb, id) {
  const result = {};
  for (let url in urlDb) {
    if (urlDb[url].userID === id) {
      result[url] = urlDb[url].longURL;
    }
  }
  return result;
};

const generateRandomString = function() {
  return Math.random().toString(36).substr(2, 6);
};



module.exports = { inUser, urlsForUser, generateRandomString};