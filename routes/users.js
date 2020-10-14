const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

const keys = require('../config/keys')
const verify = require('../utilities/verify-token')

const User = require('../models/User')

router.get('/', (req, res) => {
  try {
    let jwtUser = jwt.verify(verify(req), keys.secretOrKey)
    let id = mongoose.Types.ObjectId(jwtUser.id)
    console.log(jwtUser.id)

    User.aggregate()
      .match({ _id: { $not: { $eq: id } } })
      .project({
        password: 0,
        __v: 0,
        date: 0
      })
      .exec((err, users) => {
        if (!err) res.send(users)
        else {
          console.log(err)
          res.status(500).end(JSON.stringify({ message: 'Failure' }))
        }
      })
  } catch (err) {
    console.log(err)
    res.status(401).end(JSON.stringify({ message: 'Unauthorized' }))
  }
})

module.exports = router
