/* global describe, it */

'use strict'

var should = require('should')
var fetchTimeline = require('..')

var credentials = {
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}

describe('fetch-timeline ::', function () {
  it('retrieve the correct number of tweets specified in limit', function (done) {
    var timeline = fetchTimeline({
      limit: 100
    }, credentials)

    var count = 0

    timeline
      .on('data', function () {
        ++count
      })
      .on('end', function () {
        count.should.be.equal(100)
        done()
      })
      .on('err', done)
  })

  it('fetch obj shoul be correct', function (done) {
    var timeline = fetchTimeline({
      limit: 100
    }, credentials)

    timeline
      // necessary to be possible acces to rs stream
      .on('data', function () {})
      .on('err', done)
      .on('fetched', function (fetched) {
        fetched.should.have.property.user
        fetched.should.have.property.calls
        fetched.should.have.property.newerTweetDate
        fetched.should.have.property.olderTweetDate
        done()
      })
  })
})
