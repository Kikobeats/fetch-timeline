'use strict';

var fetchTimeline = require('./index');

var options = {
  credentials: {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  },

  params: {
    screen_name: 'kikobeats',
    limit: 100
  },

  tempFile: {
    path: '/tmp',
    ext: '.json'
  }
};

var show = function(err, timeline) {

  if (arguments.length === 1) {
    timeline = err;
    err = null;
  }

  if (err) throw err;
  console.log('userId:\t\t', timeline.userId);
  console.log('firstTweetDate:\t', timeline.firstTweetDate);
  console.log('lastTweetDate:\t', timeline.lastTweetDate);
  console.log('size:\t\t', timeline.size);
  console.log('path:\t\t', timeline.tweets.path);
  timeline.tweets.cleanup(process.exit);
};

/// Callback mode

fetchTimeline(options, show);

/// Events mode

// var fetchTimeline = fetchTimeline(options);

// fetchTimeline.on('data', function(chunk) {
//   console.log("fetched ::", chunk.length);
// });

// fetchTimeline.on('end', show);

// fetchTimeline.on('progress', function(progress) {
//   console.log("progress ::", progress);
// });

// fetchTimeline.on('error', function(err) {
//   throw err;
// });
