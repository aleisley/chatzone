const obj = require('../config.json')

module.exports = {
  mongoURI:
    `mongodb+srv://${obj.mongoUsername}:${obj.mongoPassword}@cluster0.srpd1.mongodb.net/chat-app?retryWrites=true&w=majority`,
  secretOrKey: `${obj.secretOrKey}`,
};
