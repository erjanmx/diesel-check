const Crawler = require("crawler")

const lowDb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const db = lowDb(new FileSync('db.json'))

const winston = require('winston')

const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console(),
  ]
});

// Set some defaults (required if your JSON file is empty)
db.defaults({ forums: [], topics: [] }).write()

const topicCrawler = new Crawler({
  callback: (_error, res, done) => {
    const $ = res.$;

    let topic = {
      url: $("[name=identifier-url]").attr("content"),
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

const forumCrawler = new Crawler({
  callback: (_error, res, done) => {
    const $ = res.$;

    $('.topic_title').each(function () {
      topicCrawler.queue({
        uri: $(this).attr('href') + '&view=getlastpost',
        forum_id: res.options.forum_id,
      });
    });

    done();
  }
});

function saveTopic(topic) {
  logger.debug('Saving topic', topic)

  console.log(topic);
}

function queueForum(id) {
  logger.debug('Queueing forum', {'id': id})

  forumCrawler.queue({
    uri: 'http://diesel.elcat.kg/index.php?showforum=' + id,
    forum_id: id,
  });
}

const express = require('express');
const app = express();

app.use(express.static(__dirname));

logger.error('hey');

const server = app.listen(3000, () => {  
  console.log(server.address().port);

  logger.debug(`Server started on port: ${server.address().port}`);

  // todo: open browser

  queueForum(227);

  // setInterval(() => {
  //   queueForum(227);
  // }, 60000)
});
