'use strict'

const should = require('should')

const differenceInDays = require('date-fns/difference_in_days')
const twitterClient = require('../lib/twitter-client')
const fetchTimeline = require('..')

const credentials = {
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
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
    it('limit how many tweets to retrieve', function (done) {
      const limit = 30

      const params = {
        screenName: 'kikobeats',
        count: 20
      }

      const opts = {
        credentials,
        limit
      }

      const meta = {}
      let count = 0

      const stream = fetchTimeline(params, opts)

      stream
        .on('error', done)
        .on('data', function (tweet) {
          if (count === 0) {
            meta.newerTweetDate = new Date(tweet.created_at)
          }

          ++count
          meta.user = tweet.user
          meta.olderTweetDate = new Date(tweet.created_at)
        })
        .on('info', function (info) {
          should(info.count).be.equal(limit)
          should(count).be.equal(limit)

          should(info.user).be.eql(meta.user)
          should(info.apiCalls).be.equal(2)
          should(info.newerTweetDate).be.eql(meta.newerTweetDate)
          should(info.olderTweetDate).be.eql(meta.olderTweetDate)
          done()
        })
    })

    it('limit how many tweets to retrieve in days', function (done) {
      const limitDays = 7

      const params = {
        screenName: 'kikobeats',
        count: 200
      }

      const opts = {
        credentials,
        limitDays
      }

      const meta = {}
      let count = 0

      const stream = fetchTimeline(params, opts)

      stream
        .on('error', done)
        .on('data', function (tweet) {
          if (count === 0) {
            meta.newerTweetDate = new Date(tweet.created_at)
          }

          ++count
          meta.user = tweet.user
          meta.olderTweetDate = new Date(tweet.created_at)
        })
        .on('info', function (info) {
          should(info.user).be.eql(meta.user)
          should(info.newerTweetDate).be.eql(meta.newerTweetDate)
          should(info.olderTweetDate).be.eql(meta.olderTweetDate)
          should(info.apiCalls).be.equal(1)

          const diffDays = differenceInDays(info.timestamp, info.olderTweetDate)

          should(diffDays + 1).be.equal(limitDays)

          done()
        })
    })

    it('combine limit and limitDays', function (done) {
      const limitDays = 2
      const limit = 30

      const params = {
        screenName: 'kikobeats',
        count: 200
      }

      const opts = {
        credentials,
        limit,
        limitDays
      }

      const meta = {}
      let count = 0

      const stream = fetchTimeline(params, opts)

      stream
        .on('error', done)
        .on('data', function (tweet) {
          if (count === 0) {
            meta.newerTweetDate = new Date(tweet.created_at)
          }

          ++count
          meta.user = tweet.user
          meta.olderTweetDate = new Date(tweet.created_at)
        })
        .on('info', function (info) {
          should(info.user).be.eql(meta.user)
          should(info.apiCalls).be.equal(1)
          should(info.newerTweetDate).be.eql(meta.newerTweetDate)
          should(info.olderTweetDate).be.eql(meta.olderTweetDate)

          const diffDays = differenceInDays(info.timestamp, info.olderTweetDate)

          should(diffDays + 1).be.equal(limitDays)
          should(info.count <= limit).be.true()
          done()
        })
    })
  })
})
