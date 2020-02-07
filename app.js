const socket = io();

new Vue({
  el: '#app',
  data: {
    topics: [],
    check_forum_id: null,
  },
  methods: {
    loadTopics() {
      axios.get('/topics').then(
        response => this.topics = response.data
      );
    },
    onForumChange(event) {
      axios.post('/forum/set?id=' + event.target.value).then(() => this.loadTopics());
    },
    loadActiveForum() {
      axios.get('/forum/get').then((response) => {
        this.check_forum_id = response.data;
        this.loadTopics();
      });
    },
    getTopicHref(topic) {
      return 'http://diesel.elcat.kg?showtopic=' + topic.id;
    },
    getTopicAuthorHref(topic) {
      return 'http://diesel.elcat.kg?showuser=' + topic.author_id;
    },
    getTopicPostsTooltip(topic) {
      return topic.posts.map((post) => moment(post.time).utcOffset(+6).format("DD-MM-YYYY, HH:mm")).join("\n");
    },
  },
  mounted() {    
    this.loadActiveForum();
    
    socket.on('topics', () => { this.loadTopics() });
  }
});
