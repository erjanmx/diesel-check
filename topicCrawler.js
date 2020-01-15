const fs = require('fs');
const Crawler = require("crawler")

const regexTotalPagesCount = /totalPages: ([\d]+), anchor/;

function save(topic) {
    console.log(topic);
}

const crawler = new Crawler({
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
	    author_name: post.find("[itemprop=commentTime]").attr('title')
	});
    }); 

    save(topic);

    done();
  }
});

crawler.queue([{
    html: fs.readFileSync('pages/1.html', 'utf8')
}]);

