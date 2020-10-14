const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const router = express.Router()

const keys = require('../config/keys')
const verify = require('../utilities/verify-token')

const Conversation = require('../models/Conversation')
const GlobalMessage = require('../models/GlobalMessage')
const Message = require('../models/Message')

let jwtUser

router.use(async (req, res, next) => {
  try {
    jwtUser = await jwt.verify(verify(req), keys.secretOrKey)
    next()
  } catch (err) {
    console.log(err)
    res.status(401).end(JSON.stringify({ message: 'Unauthorized' }))
  }
})

router.get('/global', (req, res) => {
  GlobalMessage.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'from',
        foreignField: '_id',
        as: 'fromObj'
      }
    }
  ])
    .project({
      'fromObj.password': 0,
      'fromObj.__v': 0,
      'fromObj.date': 0
    })
    .exec((err, messages) => {
      if (err) res.status(500).end(JSON.stringify({ message: 'Unauthorized' }))
      else res.send(messages)
    })
})

router.post('/global', (req, res) => {
  let message = new GlobalMessage({
    from: jwtUser.id,
    body: req.body.body
  })

  req.io.sockets.emit('messages', req.body.body)
  message.save(err => {
    if (err) res.status(500).end(JSON.stringify({ message: 'Failure' }))
    else res.send({ message: 'Message sent!' })
  })
})

// Get conversations list
router.get('/conversations', (req, res) => {
  let from = mongoose.Types.ObjectId(jwtUser.id)
  Conversation.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'recipients',
        foreignField: '_id',
        as: 'recipientObj'
      }
    }
  ])
    .match({ recipients: { $all: [{ $elemMatch: { $eq: from } }] } })
    .project({
      'recipientObj.password': 0,
      'recipientObj.__v': 0,
      'recipientObj.date': 0
    })
    .exec((err, conversations) => {
      if (err) res.status(500).end(JSON.stringify({ message: 'Failure' }))
      else res.send(conversations)
    })
})

router.get('/conversations/query', (req, res) => {
  const user1 = mongoose.Types.ObjectId(jwtUser.id)
  const user2 = mongoose.Types.ObjectId(req.query.userId)

  Message.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'to',
        foreignField: '_id',
        as: 'toObj'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'from',
        foreignField: '_id',
        as: 'fromObj'
      }
    }
  ])
    .match({
      $or: [
        { $and: [{ to: user1 }, { from: user2 }] },
        { $and: [{ to: user2 }, { from: user1 }] }
      ]
    })
    .project({
      'toObj.password': 0,
      'toObj.__v': 0,
      'toObj.date': 0,
      'fromObj.password': 0,
      'fromObj.__v': 0,
      'fromObj.date': 0,
    })
    .exec((err, messages) => {
      if (err) res.status(500).end(JSON.stringify({ message: 'Failed' }))
      else res.send(messages)
    })
})

router.post('/', (req, res) => {
  let from = mongoose.Types.ObjectId(jwtUser.id)
  let to = mongoose.Types.ObjectId(req.body.to)

  Conversation.findOneAndUpdate(
    {
      recipients: {
        $all: [
          { $elemMatch: { $eq: from } },
          { $elemMatch: { $eq: to } }
        ]
      }
    },
    {
      recipients: [jwtUser.id, req.body.to],
      lastMessage: req.body.body,
      date: Date.now()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
    (err, conversation) => {
      if (err) res.state(500).end(JSON.stringify({ message: 'Failure' }))
      else {
        let message = new Message({
          conversation: conversation._id,
          to: req.body.to,
          from: jwtUser.id,
          body: req.body.body
        })

        req.io.sockets.emit('messages', req.body.body)

        message.save(err => {
          if (err) res.status(500).end(JSON.stringify({ message: 'Failure' }))
          else res.send({ message: 'Success', conversationId: conversation._id })
        })
      }
    }
  )
})

module.exports = router
