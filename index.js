const Crawler = require("crawler")

const regexTotalPagesCount = /totalPages: ([\d]+), anchor/;

const crawler = new Crawler({
  callback: (_error, res, done) => {
    const found = res.body.match(regexTotalPagesCount);

    const pagesCount = found[1];
    
    for (let page = 2; page <= pagesCount; page++) {
      pageCrawler.queue(res.request.uri.href + '&page=' + page);
      break;
    }
    done();
  }
});

const pageCrawler = new Crawler({
  rateLimit: 1000,
  callback: (_error, { $ }, done) => {
    $('.topic_title').each(function () {
      topicCrawler.queue($(this).attr('href'));
    });
    done();
  }
});

const topicCrawler = new Crawler({
  rateLimit: 1000,
  callback: (_error, { $ }, done) => {
    console.log($('title').text());
    done();
  }
});

crawler.queue('http://diesel.elcat.kg/index.php?showforum=28&prune_day=1&sort_by=Z-A&sort_key=last_post&topicfilter=all&page=1');
