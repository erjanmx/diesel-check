require('dotenv').config();

const _ = require('lodash');
const open = require('open');
const path = require('path');
const cron = require('node-cron');
const winston = require('winston');
const crawler = require("crawler");
const moment = require('moment-timezone');

const cwd = process.pkg ? path.dirname(process.execPath) : process.cwd();
const lowDb = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');
const dbTopics = lowDb(new fileSync(cwd + '/db/topics.json'));

const express = require('express');
const app = express();
const socketIO = require('socket.io');

const crawlerProxy = process.env.CRAWLER_PROXY || '';  
const queueOnStart = process.env.QUEUE_ON_START || 'TRUE'; 
const runAsService = process.env.RUN_AS_SERVICE || 'TRUE'; 
const queueCronExpression = process.env.QUEUE_CRON_EXPRESSION || '0 * * * *';  

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

  const topic = dbTopics.get('topics').find({ id: data.id });

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
  proxy: crawlerProxy,
  rateLimit: process.env.CRAWLER_RATE_LIMIT || 0,
  callback: (_error, res, done) => {
    logger.debug('Parsing topic page: ' + res.request.uri.href);

    const $ = res.$;
    const topic = {
      id: $('body').find('input[name="t"]').val(),
      title: $(".ipsType_pagetitle").text(),
      forum_id: res.options.forum_id,
      author_id: $("[itemprop=creator]").find("[hovercard-ref=member]").attr('hovercard-id'),
      author_name: $("[itemprop=creator]").find("[itemprop=name]").text(),
      author_posts: [],
    };

    $(".post_block").each(function () {
      const post = $(this);
      
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
  proxy: crawlerProxy,
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

  const forums = lowDb(new fileSync(cwd + '/db/forums.json')).get('forums').value();
  
  for (forum of forums) {
    logger.debug('Queueing forum: ' + forum.id);

    forumCrawler.queue({
      uri: 'http://diesel.elcat.kg/index.php?showforum=' + forum.id,
      forum_id: forum.id,
    });
  }
}

if (queueOnStart == 'TRUE') {
  queueForums();
}

if (runAsService == 'TRUE') {
  // Cron job
  cron.schedule(queueCronExpression, () => { queueForums() }, {
    timezone: timeZone,
  });
  logger.info(`Queueing cron enabled with '${queueCronExpression}' expression using timezone '${timeZone}'`);

  // Web server
  app.use(express.static(cwd));
  const server = app.listen(process.env.PORT || 3000, '127.0.0.1', () => {  
    open("http://127.0.0.1:" + server.address().port);
    logger.info("Локальный сервер запущен и доступен в браузере по адресу: http://127.0.0.1:" + server.address().port);
  });
  const io = socketIO(server);
}