const socket = io();

const router = new VueRouter({
  mode: 'history',
  routes: []
});

Vue.use(VueRouter);

new Vue({
  router,
  el: '#app',
  data: {
    topics: [],
    forums: [],
    forum_id: null,
  },
  computed: {
    filteredTopics() {
      return this.topics.filter(topic => topic.forum_id === this.forum_id);
    }
  },
  watch: {
    forum_id: function (val) {
      if (this.forums.length) {
        let p = (val !== 'null') ? `?f=${val}` : '';
        this.$router.replace(p);
      }
    },
  },
  methods: {
    loadDb() {
      axios.get('/db.json').then((response) => {
        this.topics = response.data.topics;
        this.forums = response.data.forums;
      }).then(() => {
        if (this.forum_id) { this.forum_id = parseInt(this.forum_id)}
      });
    },
    getTopicHref(topic) {
      return 'http://diesel.elcat.kg?showtopic=' + topic.id;
    },
    getTopicAuthorHref(topic) {
      return 'http://diesel.elcat.kg?showuser=' + topic.author_id;
    },
    getTopicPosts(topic) {
      return topic.posts.map((post) => moment(post.time).format("DD-MM-YYYY, HH:mm")).join("\n");
    },
  },
  mounted() {
    if (this.$route && this.$route.query.f) {
      this.forum_id = this.$route.query.f;
    }

    this.loadDb();
    
    socket.on('topics', () => { this.loadDb() });
  }
});
