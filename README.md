# fetch-timeline

![Last version](https://img.shields.io/github/tag/Kikobeats/fetch-timeline.svg?style=flat-square)
[![Dependency status](http://img.shields.io/david/Kikobeats/fetch-timeline.svg?style=flat-square)](https://david-dm.org/Kikobeats/fetch-timeline)
[![Dev Dependencies Status](http://img.shields.io/david/dev/Kikobeats/fetch-timeline.svg?style=flat-square)](https://david-dm.org/Kikobeats/fetch-timeline#info=devDependencies)
[![NPM Status](http://img.shields.io/npm/dm/fetch-timeline.svg?style=flat-square)](https://www.npmjs.org/package/fetch-timeline)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg?style=flat-square)](https://paypal.me/Kikobeats)

> Readable Stream that content tweets fetched from a Twitter user timeline.

Twitter API expose and endpoint called [statuses/usertimeline](https://dev.twitter.com/rest/reference/get/statuses/user_timeline) to get the last Twitter users tweets, but is necessary concat the HTTP
request to get more to 200 tweets per call (max to 3200).

This module encapsulate the logic to concatenate the HTTP requests.

## Install

```bash
npm install fetch-timeline --save
```

## Usage

```js
var fetchTimeline = require('fetch-timeline');
var timeline = fetchTimeline(params, credentials) // => Readable Stream
```

The events available are:

#### .on('data')

Fire with each tweet fetched from the API endpoint.

#### .on('fetched')

Fired at the end of the timeline with information of the fetching process, as:

```js
{
  user: {Object},
  newerTweetDate: {Date},
  olderTweetDate: {Date},
  size: {Number}
}
```

The rest of the readable event (`error`, `end`,...) have the same behavior.

## API

### fetchTimeline(params, credentials)

#### params

Represents the params necessary for setup the Twitter [statuses/usertimeline](https://dev.twitter.com/rest/reference/get/statuses/user_timeline) API requests.

The library internally manage the cursor between successive API calls.

#### credentials

Represents the [twit#credentials](https://github.com/ttezel/twit#var-t--new-twitconfig) to connect with Twitter API.


### Examples

See [fetch-timelie-cli#bin](https://github.com/Kikobeats/fetch-timeline-cli/blob/master/bin/index.js#L116-L146).

## Related

- [fetch-timeline-cli](https://github.com/Kikobeats/fetch-timeline-cli) – Fetch the timeline of a Twitter user from your terminal.

## License

MIT © [Kiko Beats](http://kikobeats.com)
