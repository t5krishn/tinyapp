const { generateRandomString } = require('./helper');

// Class used to create URLS
class URL {
  constructor(longURL, userID){
    this.longURL = longURL;
    this.userID = userID;
    this.createdOn = new Date();
    this.visits = {
      count : 0,
      eachVisit : [],
      uniqueVisitors : []
    }
  };
  
  incrementCount() {
    this.visits.count = this.visits.count + 1;
  };

  getUniqueVisits() {
    return this.visits.uniqueVisitors.length;
  };

  getVisits() {
    return this.visits.eachVisit;
  };

  addVisit(visitorId, time) {
    this.visits.eachVisit.push({
      visitorId,
      time
    });
    this.incrementCount();
  };

  addUnique(visitorID) {
    this.visits.uniqueVisitors.push(visitorID);
  };

};

// Class used to create new Users
class User {
  constructor(email, password) {
    this.id = generateRandomString();
    this.email = email;
    this.password = password;
  }
};


module.exports = { User, URL };