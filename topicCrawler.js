const fs = require('fs');
const Crawler = require("crawler")

const regexTotalPagesCount = /totalPages: ([\d]+), anchor/;

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
db.defaults({ topics: [] }).write()

function saveTopic(topic) {
    console.log(topic);
    return;
    let t = db.get('topics').find({ url: topic.url }).value();
    if (t === undefined) {
       db.get('topics')
          .push(topic)
          .write()	
    } else {
    
    }
    
/*
        .assign({ title: 'hi!'})
  	.write()
*/
   
   console.log(topic.title);
}

const topicCrawler = new Crawler({
  callback: (_error, { $ }, done) => {
    let topic = {
	    url: $("[name=identifier-url]").attr("content"),
    	title: $(".ipsType_pagetitle").text(),
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

topicCrawler.queue([{
  html: fs.readFileSync('pages/topic.html', 'utf8')
}]);

