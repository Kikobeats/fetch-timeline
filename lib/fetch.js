'use strict'

var from = require('from2').obj
var twitter = require('./twitter')

function isEmpty (value) {
  if (!value) return true
  return !value.length
}

function fetchTimeline (params, credentials) {
  var twitterParams = twitter.setupParams(params)
  var fetchChunk = twitter.get(credentials)
  var count = 0
  var isFirstChunk = true
  var hasTweets = true
  var cursor
  var fetched = { calls: 0 }

  function hasTweetsUnderLimit () {
    return count < twitterParams.limit
  }

  function hasFetch () {
    return hasTweets && hasTweetsUnderLimit()
  }

  function fetchTweets (cb) {
    ++fetched.calls
    if (cursor) twitterParams.max_id = cursor

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
        return cb(null, chunk)
      }

      if (isFirstChunk) {
        fetched.user = chunk[0].user
        fetched.newerTweetDate = new Date(chunk[0].created_at)
        isFirstChunk = false
      } else {
        chunk.shift()
      }

      count += chunk.length

      var lastTweet = chunk[chunk.length - 1]
      cursor = lastTweet.id_str
      fetched.olderTweetDate = new Date(lastTweet.created_at)

      return cb(null, chunk)
    })
  }

  return from(function (size, next) {
    var _this = this

    if (hasFetch()) {
      fetchTweets(function (err, tweets) {
        if (err) next(err, tweets)
        else {
          // be sure to stay under the limit
          if (count > params.limit) {
            var size = twitterParams.limit - count
            tweets = tweets.slice(0, size)
          }

          // trick to avoid push undefined
          var lastTweet = tweets.pop()
          tweets.forEach(function (tweet) {
            _this.push(tweet)
          })

          next(null, lastTweet)
        }
      })
    } else {
      next(null, null)
      this.emit('fetched', fetched)
    }
  })
}

module.exports = fetchTimeline
