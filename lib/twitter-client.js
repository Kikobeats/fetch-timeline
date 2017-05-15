'use strict'

const snakeCase = require('lodash.snakecase')
const reduce = require('lodash.reduce')
const Twit = require('twit')

const ENDPOINT = 'statuses/user_timeline'

module.exports = {
  setupParams (opts) {
    return reduce(opts, function (acc, value, key) {
      const snakeKey = snakeCase(key)
      acc[snakeKey] = value
      return acc
    }, {})
  },

  create (credentials) {
    const {
      consumerKey: consumer_key,
      consumerSecret: consumer_secret,
      accessToken: access_token,
      accessTokenSecret: access_token_secret
    } = credentials

    const twitterClient = new Twit({
      consumer_key,
      consumer_secret,
      access_token,
      access_token_secret
    })

    const get = (opts, cb) => twitterClient.get(ENDPOINT, opts, cb)

    return get
  }
}
