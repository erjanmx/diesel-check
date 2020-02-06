const _ = require('lodash');
const winston = require('winston')
const crawler = require("crawler")

const lowDb = require('lowdb')
const fileSync = require('lowdb/adapters/FileSync')
const db = lowDb(new fileSync('db.json'))

const express = require('express');
const app = express();


const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console(),
  ]
});

// Set some defaults (required if your JSON file is empty)
db.defaults({ forums: [], topics: [] }).write()

const topicCrawler = new crawler({
  callback: (_error, res, done) => {
    logger.debug('Parsing topic: ' + res.uri);

    const $ = res.$;

    let topic = {
      id: $('body').find('input[name="t"]').val(),
    	title: $(".ipsType_pagetitle").text(),
      forum_id: res.options.forum_id,
      author_id: $("[itemprop=creator]").find("[hovercard-ref=member]").attr('hovercard-id'),
      author_name: $("[itemprop=creator]").find("[itemprop=name]").text(),
      posts: [],
    };

    $(".post_block").each(function () {
    	let post = $(this);
	    topic.posts.push({
        id: post.find("[itemprop=replyToUrl]").attr('data-entry-pid'),
        time: post.find("[itemprop=commentTime]").attr('title'),
        author_id: post.find("[hovercard-ref=member]").attr('hovercard-id'),
        author_name: post.find("[hovercard-ref=member]").children("span").html(),
	    });
    }); 

    saveTopic(topic);

    done();
  }
});

const forumCrawler = new crawler({
  callback: (_error, res, done) => {
    logger.debug('Parsing forum page: ' + res.uri);

    const $ = res.$;

    $('.topic_title').each(function () {
      logger.debug('Queueing topic: ' + $(this).attr('href'));

      topicCrawler.queue({
        uri: $(this).attr('href') + '&view=getlastpost',
        forum_id: res.options.forum_id,
      });
    });

    done();
  }
});

let topicDb = db.get('topics');

function saveTopic(data) {
  let topic = topicDb.find({ id: data.id });

  if (topic.value()) {
    logger.debug('Updating topic', data);

    topic.assign({ posts: _.unionWith(data.posts, topic.value().posts, _.isEqual) }).write();
  } else {
    logger.debug('Creating topic', data);

    topicDb.push(data).write();
  }
}

function queueForum(id) {
  logger.debug('Queueing forum: ' + id);

  forumCrawler.queue({
    uri: 'http://diesel.elcat.kg/index.php?showforum=' + id,
    forum_id: id,
  });
}

app.use(express.static(__dirname));

app.get('/topics', (req, res) => {
  return res.json(topicDb.value());
});

const server = app.listen(3000, () => {  
  console.log(server.address().port);

  logger.debug('Server started on port: ' + server.address().port);

  // todo: open browser

  // queueForum(227);

  // setInterval(() => {
  //   queueForum(227);
  // }, 60000)
});
