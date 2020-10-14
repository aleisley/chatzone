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

const io = require('socket.io').listen(server)

// Body Parser middleware to parse request bodies
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(bodyParser.json())

// CORS middleware
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
