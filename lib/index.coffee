'use strict'

fs             = require 'fs'
Twit           = require 'twit'
async          = require 'async'
duplexer2      = require 'duplexer2'
objectAssign   = require 'object-assign'
tempFileStream = require 'create-temp-file2'
EventEmitter   = require('events').EventEmitter

isEmpty = (value) ->
  return true unless value
  not value.length

write = (stream, value, cb) ->
  stream.emit 'data', value
  stream.write value, cb

end = (stream, value, cb) ->
  stream.emit 'data', value
  stream.end value, cb

# Based in the statuses/user_timeline limitations
# for more information, check: https://dev.twitter.com/rest/reference/get/statuses/user_timeline

DEFAULT =
  PARAMS:
    count: 200
    limit: 3200
    include_rts: false
    exclude_replies: false

module.exports = (options, cb) ->

  eventEmitter = new EventEmitter()

  { credentials, params, tempFile } = options

  params = objectAssign DEFAULT.PARAMS, params
  params.limit = DEFAULT.limit if params.limit > DEFAULT.limit

  twitter = new Twit
    consumer_key        : credentials.consumerKey
    consumer_secret     : credentials.consumerSecret
    access_token        : credentials.accessToken
    access_token_secret : credentials.accessTokenSecret

  tweetsCounter     = 0
  fileEmpty         = true
  hastTweetsToFetch = true
  isFirstChunk      = true
  user              = undefined
  firstTweetDate    = undefined
  lastTweetDate     = undefined
  lastId            = undefined

  writable = tempFileStream tempFile
  readable = fs.createReadStream writable.path
  duplex = duplexer2 writable, readable

  hasTweets = ->
    return hastTweetsToFetch unless hastTweetsToFetch
    return true if tweetsCounter < params.limit
    false

  fetchTweets = (next) ->
    params.max_id = lastId if lastId
    twitter.get 'statuses/user_timeline', params, (err, chunk) ->
      return next err if err

      if isFirstChunk
        isFirstChunk = false

        # Twitter accounts without tweets
        if isEmpty chunk
          hastTweetsToFetch = false
          return next()

        write duplex, '['
        fileEmpty = false
        user = chunk[0].user
        firstTweetDate = new Date chunk[0].created_at
      else
        # Get rid of the first element of each iteration (not the first time)
        # because the pagination is based in the max_id and starts in 0.
        chunk.shift()

        # Last Tweet Dump
        if isEmpty chunk
          hastTweetsToFetch = false
          return next()

        write duplex, ','

      lastId = chunk[chunk.length - 1].id_str

      isFirstTweet = true

      async.forEachSeries chunk, (tweet, nextTweet) ->
        if tweetsCounter >= params.limit
          hastTweetsToFetch = false
          return nextTweet()

        ++tweetsCounter
        tweetString = JSON.stringify tweet, null, 2

        if isFirstTweet
          write duplex, tweetString
          isFirstTweet = false
        else
          write duplex, ',' + tweetString
          lastTweetDate = new Date(tweet.created_at)

        nextTweet()
      , next

  fetchTimeline = (cb) ->
    async.whilst hasTweets, fetchTweets, (err) ->
      finalWrite = if fileEmpty then '[]' else ']'
      end duplex, finalWrite, ->

        timeline =
          user           : user
          firstTweetDate : firstTweetDate
          tweets         : writable
          lastTweetDate  : lastTweetDate
          size           : tweetsCounter

        cb err, timeline

  return fetchTimeline cb if cb

  fetchTimeline (err, timeline) ->
    duplex.emit 'error', err if err
    duplex.emit 'fetched', timeline

  duplex
