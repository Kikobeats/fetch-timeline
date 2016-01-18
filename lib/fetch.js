'use strict'

var twitter = require('./twitter.js')
var doWhilst = require('async.dowhilst')
var eachSeries = require('async.eachseries')
var Stream = require('readable-stream').Stream

function isEmpty (value) {
  if (!value) return true
  return !value.length
}

function fetchTimeline (params, credentials) {
  var twitterParams = twitter.setupParams(params)
  var fetchChunk = twitter.get(credentials)
  var readable = Stream.Readable({ objectMode: true })

  var tweetsCounter = 0
  var isStreamEmpty = true
  var isFirstChunk = true
  var hasTweets = true

  var newerTweetDate
  var olderTweetDate
  var lastIdFetched
  var user

  var handleChunk = {
    // first chunk
    true: function (chunk) {
      isStreamEmpty = false
      user = chunk[0].user
      newerTweetDate = new Date(chunk[0].created_at)
      return false
    },
    // rest of chunks
    false: function (chunk) {
      chunk.shift()
      return false
    }
  }

  function hasTweetsToFetch () {
    var tweetsUnderLimit = tweetsCounter >= twitterParams.limit
    return hasTweets && tweetsUnderLimit
  }

  function fetchTweets (cb) {
    if (lastIdFetched) twitterParams.max_id = lastIdFetched
    fetchChunk(twitterParams, function (err, chunk, res) {
      if (err) {
        err.headers = res.headers
        return cb(err, res)
      }

      // user without tweets
      // user with protected account
      // user with no more chunk of tweets
      if (isEmpty(chunk)) {
        hasTweets = false
        return cb()
      }

      isFirstChunk = handleChunk[isFirstChunk](chunk)
      lastIdFetched = chunk[chunk.length - 1].id_str

      var isFirstTweet = true

      // At this point chunk is an array of tweet
      // Need to put into the stream

      var tweetHandle = {
        true: function (tweet) {
          return false
        },

        false: function (tweet) {
          olderTweetDate = new Date(tweet.created_at)
          return false
        }
      }

      return eachSeries(chunk, function (tweet, next) {
        if (tweetsCounter >= twitterParams.limit) {
          hasTweets = false
          return next()
        }

        ++tweetsCounter
        isFirstTweet = tweetHandle[isFirstTweet](tweet)
        readable.push(tweet)
        return next()
      }, cb)
    })
  }

  readable._read = function () {
    var _this = this
    doWhilst(fetchTweets, hasTweetsToFetch, function (err, res) {
      if (err) _this.emit('error', err, res)

      _this.push(null)

      _this.emit('fetched', {
        user: user,
        newerTweetDate: newerTweetDate,
        olderTweetDate: olderTweetDate,
        size: tweetsCounter
      })
    })
  }

  return readable
}

module.exports = fetchTimeline
