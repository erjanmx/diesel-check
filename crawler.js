const _ = require('lodash');
const winston = require('winston')
const crawler = require("crawler")

const lowDb = require('lowdb')
const fileSync = require('lowdb/adapters/FileSync')
const db = lowDb(new fileSync('db.json'))

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const logger = winston.createLogger({
  level: 'debug',
  transports: [ new winston.transports.Console() ]
});

// Database
db.defaults({ topics: [], check_forum_id: null }).write()

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

// Crawlers
const topicCrawler = new crawler({
  callback: (_error, res, done) => {
    logger.debug('Parsing topic page: ' + res.request.uri.href);

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
    logger.debug('Parsing forum page: ' + res.request.uri.href);

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

topicCrawler.on('drain', function () {
  io.emit('topics', 'updated');
});

function queueForum() {
  let forum_id = db.get('check_forum_id').value();

  if (!forum_id) {
    return;
  }
  logger.debug('Queueing forum: ' + forum_id);

  forumCrawler.queue({
    uri: 'http://diesel.elcat.kg/index.php?showforum=' + forum_id,
    forum_id: forum_id,
  });
}

// Web server
app.use(express.static(__dirname));

app.get('/topics', (req, res) => {
  return res.json(topicDb.filter({ forum_id: db.get('check_forum_id').value() }).value());
});

app.post('/forum/set', (req, res) => {
  db.set('check_forum_id', parseInt(req.query['id'])).write();
  res.send();

  queueForum();
});

app.get('/forum/get', (req, res) => {
  return res.json(db.get('check_forum_id').value());
});

const server = app.listen(3000, () => {  
  io.listen(server);

  logger.debug('Server started on port: ' + server.address().port);

  setInterval(() => { queueForum() }, 1000 * 60 * 10); // 10 minutes

  console.log("Сервер запущен и доступен в браузере по адресу: http://127.0.0.1:" + server.address().port);
});
