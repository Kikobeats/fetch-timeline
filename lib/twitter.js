'use strict'

var Twit = require('twit')
var CONST = require('./constant')
var DEFAULT = require('./default')
var existsAssign = require('existential-assign')

module.exports = {
  setupParams: function (params) {
    params = existsAssign(DEFAULT, params)
    if (params.limit > DEFAULT.limit) params.limit = DEFAULT.limit
    return params
  },

  get: function (credentials) {
    var twitterClient = new Twit({
      consumer_key: credentials.consumerKey,
      consumer_secret: credentials.consumerSecret,
      access_token: credentials.accessToken,
      access_token_secret: credentials.accessTokenSecret
    })

    return function (params, cb) {
      return twitterClient.get(CONST.ENDPOINT, params, cb)
    }
  }
}
