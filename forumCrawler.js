const fs = require('fs');
const Crawler = require("crawler")

const regexTotalPagesCount = /totalPages: ([\d]+), anchor/;

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

const crawler = new Crawler({
  callback: (_error, { $ }, done) => {
    $('.topic_title').each(function () {
      console.log($(this).attr('href') + '&view=getlastpost');
    });

    done();
  }
});

crawler.queue([{
    html: fs.readFileSync('pages/forum.html', 'utf8')
}]);
