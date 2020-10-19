const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const passport = require('passport')
const cors = require('cors')

const auth = require('./routes/auth')
const users = require('./routes/users')
const messages = require('./routes/messages')

const app = express()

// Port that the webserver listens to
const port = process.env.PORT || 5000

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

const io = require('socket.io')(server, {
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": true
    };
    res.writeHead(200, headers);
    res.end();
  }
})

// Body Parser middleware to parse request bodies
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(bodyParser.json())

// const whitelist = ['*']
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else if (whitelist.indexOf('*') !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }

// CORS middleware
// app.use(cors(corsOptions))
app.use(cors())

// Database configuration
const db = require('./config/keys').mongoURI
mongoose
  .connect(db, { useNewUrlParser: true, useFindAndModify: false })
  .then(() => console.log('MongoDB Successfully Connected'))
  .catch(err => console.log(err))

// Passport middleware
app.use(passport.initialize())
// Passport config
require('./config/passport')(passport)

// Assign socket object to every request
app.use((req, res, next) => {
  req.io = io
  next()
})

// Routes
app.use('/', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/messages', messages)
