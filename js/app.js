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

    loading: false,
    last_update: null,
  },
  computed: {
    filteredTopics() {
      return this.topics
        .filter(t => (t.forum_id === this.forum_id) && (this.isToday(t.last_post_time)) && (t.author_posts.length))
        .sort((t1, t2) => t2.author_posts.length - t1.author_posts.length);
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
    loadTopics() {
      this.loading = true;
      axios.get('/db/topics.json').then((response) => {
        this.topics = response.data.topics || [];
        this.last_update = moment.parseZone(response.data.updated_at);
        this.loading = false;
      });
    },
    loadForums() {
      axios.get('/db/forums.json').then((response) => {
        this.forums = response.data.forums || [];
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
    getTopicPostsTime(topic) {
      return topic.author_posts.map((post) => moment.parseZone(post.time).format("HH:mm")).sort();
    },
    isToday(time) {
      return moment.parseZone(time).isSame(moment().utcOffset(+6), 'day');
    },
  },
  mounted() {
    if (this.$route && this.$route.query.f) {
      this.forum_id = this.$route.query.f;
    }

    this.loadForums();

    socket.on('topics', () => { this.loadTopics() });
    socket.on('connect', () => { this.loadTopics() });
  }
});
