const Crawler = require("crawler")

const regexTotalPagesCount = /totalPages: ([\d]+), anchor/;

const crawler = new Crawler({
  callback: (_error, { $ }, done) => {
    $('.topic_title').each(function () {
      topicCrawler.queue($(this).attr('href'));
    });

    done();
  }
});
