'use strict'

Twit           = require 'twit'
async          = require 'async'
objectAssign   = require 'object-assign'
tempFileStream = require 'create-temp-file2'
EventEmitter   = require('events').EventEmitter

isEmpty = (value) ->
  return true unless value
  not value.length

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

  userInfo = params.user_id or params.screen_name
  userInfo = 'fetching ' + if userInfo then "'#{userInfo}' tweets" else 'tweets'

  tempFile = tempFileStream tempFile

  hasTweets = ->
    return hastTweetsToFetch unless hastTweetsToFetch
    return true if tweetsCounter < params.limit
    false

  fetchTweets = (next) ->
    params.max_id = lastId if lastId
    twitter.get 'statuses/user_timeline', params, (err, chunk) ->
      return next err if err

      eventEmitter.emit 'data', chunk

      if isFirstChunk
        isFirstChunk = false

        # Twitter accounts without tweets
        if isEmpty chunk
          hastTweetsToFetch = false
          return next()

        tempFile.write '['
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

        tempFile.write ','

      lastId = chunk[chunk.length - 1].id_str

      isFirstTweet = true

      async.forEachSeries chunk, (tweet, nextTweet) ->
        if tweetsCounter >= params.limit
          hastTweetsToFetch = false
          return nextTweet()

        eventEmitter.emit 'progress', (++tweetsCounter / params.limit) * 100

        tweetString = JSON.stringify tweet, null, 2

        if isFirstTweet
          tempFile.write tweetString
          isFirstTweet = false
        else
          tempFile.write ',' + tweetString
          lastTweetDate = new Date(tweet.created_at)

        nextTweet()
      , next

  fetchTimeline = (cb) ->
    async.whilst hasTweets, fetchTweets, (err) ->
      finalWrite = if fileEmpty then '[]' else ']'
      tempFile.end finalWrite, ->

        timeline =
          user: user
          firstTweetDate: firstTweetDate
          tweets: tempFile
          lastTweetDate: lastTweetDate
          size: tweetsCounter

        cb err, timeline

  return fetchTimeline cb if cb

  fetchTimeline (err, timeline) ->
    eventEmitter.emit 'error', err if err
    eventEmitter.emit 'end', timeline

  eventEmitter
