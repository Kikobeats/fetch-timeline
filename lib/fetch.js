'use strict'

const differenceInDays = require('date-fns/difference_in_days')
const debug = require('debug')('fetch-timeline')
const {last, first, isEmpty} = require('lodash')
const subDays = require('date-fns/sub_days')
const isAfter = require('date-fns/is_after')
const from = require('from2').obj

const int64decrement = require('./int64-decrement')
const twitterClient = require('./twitter-client')

const logTweet = (tweet, index) => {
  const screeName = tweet.user.screen_name
  const tweetId = tweet.id_str
  const tweetUrl = `https://twitter.com/${screeName}/status/${tweetId}`

  debug(`
    #${++index}
    id=${tweet.id}
    createdAt=${tweet.created_at}
    url=${tweetUrl}
    text=${tweet.text}
  `)
}

function fetchTimeline (params, opts) {
  const {credentials, limit, limitDays} = opts
  const twitterParams = twitterClient.setupParams(params)
  const fetchChunk = twitterClient.create(credentials)

  const info = {apiCalls: 0, count: 0, timestamp: Date.now()}
  let isFirstChunk = true
  let isUnderLimit = true
  let cursor = false

  const hasFetch = () => {
    return isFirstChunk || (isUnderLimit && cursor)
  }

  function fetchTweets (cb) {
    ++info.apiCalls
    if (cursor) twitterParams.max_id = cursor

    fetchChunk(twitterParams, function (err, chunk, res) {
      debug(`fetchChunk #${info.apiCalls} of ${chunk.length} tweets`)

      if (err) {
        err.headers = res.headers
        return cb(err, res)
      }

      // user without tweets
      // user with protected account
      // user with no more chunk of tweets
      if (isEmpty(chunk)) return cb()

      if (isFirstChunk) {
        info.user = first(chunk).user
        isFirstChunk = false
      }

      return cb(null, chunk)
    })
  }

  const stream = from(function (size, next) {
    const finish = () => {
      this.emit('info', info)
      return next(null, null)
    }

    if (!hasFetch()) return finish()

    fetchTweets((err, tweets) => {
      if (err) return next(err)

      // excedeed tweets
      if (limit && info.count + tweets.length > limit) {
        const maxTweets = limit - info.count
        debug(`resizing, limit excedeed by ${maxTweets} tweets`)
        tweets = tweets.slice(0, maxTweets)
        isUnderLimit = false
      }

      // excedeed tweets by date
      if (!isEmpty(tweets) && limitDays) {
        const olderTweetDate = new Date(last(tweets).created_at)
        const diffDays = differenceInDays(info.timestamp, olderTweetDate)

        if (diffDays > limitDays) {
          debug(`resizing, limit excedeed by ${diffDays} days`)
          const markDate = subDays(info.timestamp, limitDays)
          tweets = tweets.filter(tweet => {
            const tweetDate = new Date(tweet.created_at)
            return isAfter(tweetDate, markDate)
          })
          isUnderLimit = false
        }
      }

      if (isEmpty(tweets)) return finish()

      const lastTweet = tweets.pop()

      tweets.forEach(tweet => {
        if (info.count === 0) {
          info.newerTweetDate = new Date(tweet.created_at)
        }

        logTweet(tweet, ++info.count)
        this.push(tweet)
      })

      if (isUnderLimit) cursor = int64decrement(lastTweet.id_str)
      info.olderTweetDate = new Date(lastTweet.created_at)
      if (!info.newerTweetDate) info.newerTweetDate = info.olderTweetDate

      logTweet(lastTweet, info.count++)
      return next(null, lastTweet)
    })
  })

  return stream
}

module.exports = fetchTimeline
