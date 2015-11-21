# fetch-timeline

![Last version](https://img.shields.io/github/tag/Kikobeats/fetch-timeline.svg?style=flat-square)
[![Build Status](http://img.shields.io/travis/Kikobeats/fetch-timeline/master.svg?style=flat-square)](https://travis-ci.org/Kikobeats/fetch-timeline)
[![Dependency status](http://img.shields.io/david/Kikobeats/fetch-timeline.svg?style=flat-square)](https://david-dm.org/Kikobeats/fetch-timeline)
[![Dev Dependencies Status](http://img.shields.io/david/dev/Kikobeats/fetch-timeline.svg?style=flat-square)](https://david-dm.org/Kikobeats/fetch-timeline#info=devDependencies)
[![NPM Status](http://img.shields.io/npm/dm/fetch-timeline.svg?style=flat-square)](https://www.npmjs.org/package/fetch-timeline)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg?style=flat-square)](https://paypal.me/Kikobeats)

> Fetch the timeline of a Twitter user.

## Install

```bash
npm install fetch-timeline --save
```
Twitter API expose and endpoint called [statuses/usertimeline](https://dev.twitter.com/rest/reference/get/statuses/user_timeline) to get the last Twitter users tweets, but is necessary concat the HTTP
request to get more to 200 tweets per call (max to 3200).

This module encasuplate the logic to concatenate the HTTP request an returns you an object with the user tweets data, as:

```json
{
  userId: '101198215',
  firstTweetDate: Fri Nov 20 2015 16:40:41 GMT+0100 (CET),
  lastTweetDate: Tue Oct 27 2015 21:46:25 GMT+0100 (CET),
  size: 100
  tweets: {
    path: '/var/folders/m0/xgqrbttj0mxg9s1vrcj_ypq00000gn/T/7e0e3ca1-2f3f-46a6-b852-328963391104',
    cleanup: [Function],
   cleanupSync: [Function],
  }
}
```

The tweets are stored in a temporal file and the object give you the inmmediate information (total of tweets, userId, Dates related with the first and the last tweet...) to be not necessary load the file, just if you need to handle the tweets data.

## Usage

```js
var fetchTimeline = require('fetch-timeline');
```
You can use the library following two different ways:

### Callback Mode

The most plug and play mode:

```js
fetchTimeline(options, function(err, timeline) {
  if (err) throw err;
  console.log(timeline);
});
```

### Event Mode

The most powerful mode. It's allow you know the progress of the process and more useful things as even emitters.

```js
var fetchTimeline = fetchTimeline(options);
```

The events available in this modes are:

#### .on('data')

Fire with each Twitter API HTTP call.

```js
fetchTimeline.on('data', console.log);
```

The chunk contains a sample of tweets that will be part of the final tweets sample.

#### .on('end')

Fire at the end of the process and return the same as callback mode.

```js
fetchTimeline.on('end', console.log);
```

#### .on('progress')

Fire when the process receive a HTTP response and update the counters to know the state of the process.

The process is a 1 to 100 float number.

```js
fetchTimeline.on('progress', console.log); // => 59.7
```

#### .on('error')

Fire with whatever process error. Equivalent to `error` param in the callback mode.

```js
fetchTimeline.on('error', console.log);
```

## API

### fetchTimeline(options)

`options` is a object used to setup the process with different namespaces:

#### credentials

Represents the [twit#credentials](https://github.com/ttezel/twit#var-t--new-twitconfig) to connect with Twitter API.

#### params

Represents the params necessary for setup the Twitter [statuses/usertimeline](https://dev.twitter.com/rest/reference/get/statuses/user_timeline) API requests.


#### tempFile

Represents the options to setup the [tempfile2](https://github.com/Kikobeats/tempfile2#api) library used to specify the file path to store the data fetched.

### Examples

see `example.js`


## License

MIT © [Kiko Beats](http://kikobeats.com)
