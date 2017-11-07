'use strict'

const {snakeCase, mapKeys} = require('lodash')
const Twit = require('twit')

const ENDPOINT = 'statuses/user_timeline'

const mapKeysToSnakeCase = obj => mapKeys(obj, (value, key) => snakeCase(key))

module.exports = {
  setupParams (opts) {
    return mapKeysToSnakeCase(opts)
  },

  create (credentials) {
    const twitterClient = new Twit(mapKeysToSnakeCase(credentials))
    const get = (opts, cb) => twitterClient.get(ENDPOINT, opts, cb)
    return get
  }
}
