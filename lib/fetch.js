'use strict'

const from = require('from2').obj
const debug = require('debug')('fetch-timeline')

const twitterClient = require('./twitter-client')
const isEmpty = value => !value || !value.length
const last = arr => arr[arr.length - 1]
const first = arr => arr[0]

function fetchTimeline (params, opts) {
  const {limit, credentials} = opts
  const twitterParams = twitterClient.setupParams(params)
  const fetchChunk = twitterClient.create(credentials)

  const meta = {apiCalls: 0, count: 0}
  let isFirstChunk = true
  let hasTweets = true
  let cursor

  const hasFetch = () => hasTweets && hastTweetsBelowLimit()

  const hastTweetsBelowLimit = () => {
    if (isFirstChunk) return true
    if (limit) return meta.count < limit
    return !isFirstChunk && cursor
  }

  function fetchTweets (cb) {
    ++meta.apiCalls
    if (cursor) twitterParams.max_id = cursor

    fetchChunk(twitterParams, function (err, chunk, res) {
      debug(`fetchChunk #${meta.apiCalls} of ${chunk.length} tweets`)

      if (err) {
        err.headers = res.headers
        return cb(err, res)
      }

      // user without tweets
      // user with protected account
      // user with no more chunk of tweets
      if (isEmpty(chunk)) return cb()

      if (isFirstChunk) {
        const firstChunk = first(chunk)
        meta.user = firstChunk.user
        meta.newerTweetDate = new Date(firstChunk.created_at)
        isFirstChunk = false
      }

      meta.count += chunk.length
      const lastTweet = last(chunk)
      cursor = lastTweet.id
      meta.olderTweetDate = new Date(lastTweet.created_at)

      return cb(null, chunk)
    })
  }

  const stream = from(function (size, next) {
    if (!hasFetch()) {
      this.emit('info', meta)
      return next(null, null)
    }

    fetchTweets((err, tweets) => {
      if (err) return next(err)

      if (isEmpty(tweets)) {
        hasTweets = false
        return next(null, null)
      }

      if (limit && meta.count > limit) {
        // be under the limit
        const size = limit - meta.count
        tweets = tweets.slice(0, size)
      }

      const lastTweet = tweets.pop()
      tweets.forEach(tweet => this.push(tweet))
      return next(null, lastTweet)
    })
  })

  return stream
}

module.exports = fetchTimeline
