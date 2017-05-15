'use strict'

const concat = require('concat-stream')
const should = require('should')

const twitterClient = require('../lib/twitter-client')
const fetchTimeline = require('..')

const credentials = {
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}

const logTweet = (tweet, index) => {
  console.log(`#${++index} ${tweet.id} ${tweet.text}`)
}

describe('fetch-timeline', function () {
  describe('twitter-client', function () {
    it('default params', function () {
      const params = twitterClient.setupParams()
      should(params).be.eql({})
    })

    it('custom params', function () {
      const params = twitterClient.setupParams({
        includeRts: true,
        maxId: 1234
      })

      should(params).be.eql({
        include_rts: true,
        max_id: 1234
      })
    })
  })

  describe('fetch', function () {
    it('Limit how max tweets to retrieve', function (done) {
      const params = {
        screenName: 'kikobeats',
        includeRts: true,
        excludeReplies: true,
        count: 200
      }

      const opts = {
        credentials,
        limit: Infinity
      }

      const stream = fetchTimeline(params, opts)

      stream.on('error', done)

      stream.pipe(concat(function (buffer) {
        buffer.forEach(logTweet)
        should(buffer.length).be.lessThan(opts.limit)
        done()
      }))
    })

    it('object fecthed is correct', function (done) {
      const params = {
        screenName: 'kikobeats',
        count: 2
      }

      const opts = {
        credentials,
        limit: 4
      }

      const stream = fetchTimeline(params, opts)

      stream
      .on('error', done)
      .on('data', function () {})
      .on('info', function (meta) {
        should(meta).have.property('user')
        should(meta).have.property('apiCalls')
        should(meta).have.property('count')
        should(meta).have.property('newerTweetDate')
        should(meta).have.property('olderTweetDate')
        done()
      })
    })
  })
})
