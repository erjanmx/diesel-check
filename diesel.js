/* jshint esversion: 6 */
const cheerio = require('cheerio')
const request = require('request-promise')

export default class diesel {
  constructor() {
  }
  //http://diesel.elcat.kg/index.php?showforum=[]&prune_day=1&sort_by=Z-A&sort_key=last_post&topicfilter=all&page=1
  _request(options = {}) {
    if (!options.hasOwnProperty('url')) {
      options.url = 'http://diesel.elcat.kg'
    }

    return request(options)
  }

  getTopic(id) {
    const options = {
      transform: function (body) {
        return cheerio.load(body, {
          decodeEntities: false
        })
      },
      qs: {
        view: 'getlastpost',
        showtopic: id
      }
    }

    return this._request(options)
  }

  getTopicInfo(id) {
    return this.getTopic(id).then(function ($) {
      const user = $('.logged_in').find('#user_link')
      const topicDiv = $('.ipsBox_withphoto')

      let userId = null
      if (user.attr('href')) {
        let userMatch = user.attr('href').match(/showuser=([0-9]+)/)
        if (userMatch && userMatch[1]) {
          userId = userMatch[1]
        }
      }
      return {
        'id': id,
        'title': topicDiv.find('.ipsType_pagetitle').html(),
        'user': {
          'id': userId
        },
        'author': {
          'id': topicDiv.find('.name').attr('hovercard-id'),
          'name': topicDiv.find('.name span').html()
        }
      }
    })
  }
}