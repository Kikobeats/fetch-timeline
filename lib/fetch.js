'use strict'

const differenceInDays = require('date-fns/difference_in_days')
const debug = require('debug')('fetch-timeline')
const subDays = require('date-fns/sub_days')
const isAfter = require('date-fns/is_after')
const from = require('from2').obj

const twitterClient = require('./twitter-client')
const isEmpty = value => !value || !value.length
const last = arr => arr[arr.length - 1]
const first = arr => arr[0]

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
  let cursor

  const hasFetch = () => isFirstChunk || cursor

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
        const firstChunk = first(chunk)
        info.user = firstChunk.user
        info.newerTweetDate = new Date(firstChunk.created_at)
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
        cursor = null
      }

      // excedeed tweets by date
      if (limitDays) {
        const olderTweetDate = new Date(last(tweets).created_at)
        const diffDays = differenceInDays(info.timestamp, olderTweetDate)

        if (diffDays > limitDays) {
          debug(`resizing, limit excedeed by ${diffDays} days`)
          const markDate = subDays(info.timestamp, limitDays)
          tweets = tweets.filter(tweet => {
            const tweetDate = new Date(tweet.created_at)
            return isAfter(tweetDate, markDate)
          })
          cursor = null
        }
      }

      if (isEmpty(tweets)) return finish()

      const lastTweet = tweets.pop()
      tweets.forEach(tweet => {
        logTweet(tweet, info.count++)
        this.push(tweet)
      })

      cursor = lastTweet.id
      info.olderTweetDate = new Date(lastTweet.created_at)

      logTweet(lastTweet, info.count++)
      return next(null, lastTweet)
    })
  })

  return stream
}

module.exports = fetchTimeline
