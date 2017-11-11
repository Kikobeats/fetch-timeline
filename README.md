# fetch-timeline

[![Greenkeeper badge](https://badges.greenkeeper.io/Kikobeats/fetch-timeline.svg)](https://greenkeeper.io/)

![Last version](https://img.shields.io/github/tag/Kikobeats/fetch-timeline.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/Kikobeats/fetch-timeline/master.svg?style=flat-square)](https://travis-ci.org/Kikobeats/fetch-timeline)
[![Coverage Status](https://img.shields.io/coveralls/Kikobeats/fetch-timeline.svg?style=flat-square)](https://coveralls.io/github/Kikobeats/fetch-timeline)
[![Dependency status](https://img.shields.io/david/Kikobeats/fetch-timeline.svg?style=flat-square)](https://david-dm.org/Kikobeats/fetch-timeline)
[![Dev Dependencies Status](https://img.shields.io/david/dev/Kikobeats/fetch-timeline.svg?style=flat-square)](https://david-dm.org/Kikobeats/fetch-timeline#info=devDependencies)
[![NPM Status](https://img.shields.io/npm/dm/fetch-timeline.svg?style=flat-square)](https://www.npmjs.org/package/fetch-timeline)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg?style=flat-square)](https://paypal.me/Kikobeats)


> Fetch Twitter user timeline using a readable stream.

Twitter API expose and endpoint called [statuses/usertimeline](https://dev.twitter.com/rest/reference/get/statuses/user_timeline) to get the last Twitter users tweets, but is necessary concat the HTTP
request to get more to 200 tweets per call (max to 3200).

This module encapsulate the logic to concatenate the HTTP requests.

## Install

```bash
npm install fetch-timeline --save
```

## Usage

```js
const fetchTimeline = require('fetch-timeline')

const params = {
  screenName: 'kikobeats',
  count: 200
}

const opts = {
  credentials: {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  },
  limit: 3200,
  limitDays: 7
}

const stream = fetchTimeline(params, opts) // => Readable Stream

stream.on('data', (tweet, index) => {
  console.log(`#${++index} ${tweet.text}`)
})
```

The events available are:

#### .on('data')

Fire with each tweet fetched from the API endpoint.

#### .on('info')

Fired at the end of the timeline fetch process with meta information, such as:

```json
{
  "user": "Object",
  "apiCalls": "Number",
  "count": "Number",
  "newerTweetDate": "Date",
  "olderTweetDate": "Date",
}
```

The rest of the readable event (`error`, `end`,...) have the expected behavior.

## API

### fetchTimeline(params, opts)

#### params

Represents the params necessary for setup the Twitter endpoint [statuses/usertimeline](https://dev.twitter.com/rest/reference/get/statuses/user_timeline) for the API requests.

You need to specify the params using camelCase instead of snakeCase.

The library internally manage the cursor between successive API calls.

#### opts

##### credentials
Type: `object`


Represents the [twit#credentials](https://github.com/ttezel/twit#var-t--new-twitconfig) to connect with Twitter API.

##### limitDays
Type: `number`

Don't retrieve more older tweets than the number of days using `Date.now()` as baseline.

##### limit
Type: `number`

Use this value when you want to finish the process early, limiting the number of tweets to be fetched.

### Examples

See [fetch-timeline-cli#bin](https://github.com/Kikobeats/fetch-timeline-cli/blob/master/bin/index.js#L116-L146).

## Related

- [fetch-timeline-cli](https://github.com/Kikobeats/fetch-timeline-cli) – Fetch the timeline of a Twitter user from your terminal.
- [tweets-microservice](https://github.com/Kikobeats/tweets-microservice) – Twitter timeline fetcher as service.

## License

MIT © [Kiko Beats](http://kikobeats.com)
