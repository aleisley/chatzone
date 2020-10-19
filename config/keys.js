let obj
try {
  obj = require('../config.json')
} catch (err) {
  obj = {
    mongoUsername: process.env.MONGO_USERNAME,
    mongoPassword: process.env.MONGO_PASSWORD,
    secretOrKey: process.env.SECRET_OR_KEY
  }
}

module.exports = {
  mongoURI:
    `mongodb+srv://${obj.mongoUsername}:${obj.mongoPassword}@cluster0.srpd1.mongodb.net/chat-app?retryWrites=true&w=majority`,
  secretOrKey: `${obj.secretOrKey}`,
};
