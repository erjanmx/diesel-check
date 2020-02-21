const cwd = process.cwd();
require('dotenv').config();

const _ = require('lodash');
const cron = require('node-cron');
const openUrl = require('openurl');
const winston = require('winston');
const crawler = require("crawler");
const moment = require('moment-timezone');

const lowDb = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');
const dbTopics = lowDb(new fileSync(cwd + '/db/topics.json'));

const express = require('express');
const app = express();
const socketIO = require('socket.io');


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.json()
  ),
  transports: [ new winston.transports.Console() ]
});

const timeZone = "Asia/Almaty"; 

moment.tz.setDefault(timeZone);

function isToday(time) {
  return moment.parseZone(time).isSame(moment(), 'day');
}

// Database
dbTopics.defaults({ topics: [] }).write()

function saveTopic(data) {
  data.author_posts = data.author_posts.map(post => {
    post.time = moment(post.time).utcOffset(+6).format();
    return post;
  }).filter(post => isToday(post.time));
  
  if (data.author_posts.length === 0) {
    return;
  }

  data.last_post_time = _.last(data.author_posts).time;

  let topic = dbTopics.get('topics').find({ id: data.id });

  if (topic.value()) {
    logger.debug('Updating topic', data);
    
    topic.assign({ 
      author_posts: _.unionWith(data.author_posts, topic.value().author_posts.filter(post => isToday(post.time)), _.isEqual),
      last_post_time: data.last_post_time,
    }).write();
  } else {
    logger.debug('Creating topic', data);
    dbTopics.get('topics').push(data).write();
  }

  dbTopics.set('updated_at', moment().format()).write();
}

function removePastTopics() {
  logger.debug('Removing past topics');

  dbTopics.get('topics').remove(topic => !isToday(topic.last_post_time)).write();
}

// Crawlers
const topicCrawler = new crawler({
  rateLimit: process.env.CRAWLER_RATE_LIMIT || 0,
  callback: (_error, res, done) => {
    logger.debug('Parsing topic page: ' + res.request.uri.href);

    const $ = res.$;
    let topic = {
      id: $('body').find('input[name="t"]').val(),
      title: $(".ipsType_pagetitle").text(),
      forum_id: res.options.forum_id,
      author_id: $("[itemprop=creator]").find("[hovercard-ref=member]").attr('hovercard-id'),
      author_name: $("[itemprop=creator]").find("[itemprop=name]").text(),
      author_posts: [],
    };

    $(".post_block").each(function () {
      let post = $(this);
      
      if (topic.author_id == post.find("[hovercard-ref=member]").attr('hovercard-id')) {
        topic.author_posts.push({
          id: post.find("[itemprop=replyToUrl]").attr('data-entry-pid'),
          time: post.find("[itemprop=commentTime]").attr('title'),
        });
      }
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

  logger.info('Forums crawling has finished');
});

function queueForums() {
  removePastTopics();

  logger.info('Forums crawling has started');

  let forums = lowDb(new fileSync(cwd + '/db/forums.json')).get('forums').value();
  
  for (forum of forums) {
    logger.debug('Queueing forum: ' + forum.id);

    forumCrawler.queue({
      uri: 'http://diesel.elcat.kg/index.php?showforum=' + forum.id,
      forum_id: forum.id,
    });
  }
}

const queueOnStart = process.env.QUEUE_ON_START || 'TRUE'; 
const queueCronExpression = process.env.QUEUE_CRON_EXPRESSION || '0 * * * *';  

cron.schedule(queueCronExpression, () => { queueForums() }, {
  timezone: timeZone,
});
logger.info(`Queueing cron enabled with '${queueCronExpression}' expression using timezone '${timeZone}'`);

if (queueOnStart == 'TRUE') {
  queueForums();
}

// Web server
app.use(express.static(cwd));
const server = app.listen(process.env.PORT || 3000, () => {  
  openUrl.open("http://127.0.0.1:" + server.address().port);
  logger.info("Локальный сервер запущен и доступен в браузере по адресу: http://127.0.0.1:" + server.address().port);
});
const io = socketIO(server);
