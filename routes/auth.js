const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const saltRounds = 10
const jwt = require('jsonwebtoken')

const keys = require('../config/keys')
const validateRegisterInput = require('../validation/register')
const validateLoginInput = require('../validation/login')

const User = require('../models/User')

router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body)
  if (!isValid) {
    return res.status(400).json(errors)
  }

  User.findOne({ username: req.body.username }).then(user => {
    if (user) {
      return res.status(400).json({ message: 'Username already exists' })
    } else {
      const newUser = new User({
        name: req.body.name,
        username: req.body.username,
        password: req.body.password
      })
      bcrypt.hash(newUser.password, saltRounds, (err, hash) => {
        if (err) throw err
        newUser.password = hash
        newUser.save()
          .then(user => {
            const payload = {
              id: user.id,
              name: user.name
            }
            const cb = (err, token) => {
              if (err) throw err
              req.io.sockets.emit('users', user.username)
              res.json({
                success: true,
                token: 'Bearer ' + token,
                name: user.name
              })
            }

            // Sign token
            jwt.sign(
              payload,
              keys.secretOrKey,
              {
                expiresIn: 31556926 // 1 yr in seconds
              },
              cb
            )

          })
          .catch(err => console.log(err))
      })
    }
  })
})

router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body)
  if (!isValid) return res.status(400).json(errors)

  const username = req.body.username
  const password = req.body.password

  User.findOne({ username }).then(user => {
    if (!user) return res.status(404).json({ username: 'Username not found' })

    bcrypt.compare(password, user.password)
      .then(isMatch => {
        if (isMatch) {
          const payload = {
            id: user.id,
            name: user.name
          }

          const cb = (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token,
              name: user.name,
              username: user.username
            })
          }

          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926, // 1 year in seconds
            },
            cb
          )
        } else {
          return res.status(401).json({ loginError: 'Credentials incorrect' })
        }
      })
  })
})

module.exports = router
