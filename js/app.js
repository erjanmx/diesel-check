const socket = io();
new ClipboardJS('.tag');

moment.tz.setDefault("Asia/Almaty");

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

    search: '',
    loading: false,
    last_update: null,
  },
  computed: {
    filteredTopics() {
      return this.topics
        .filter(t => t.author_posts.length > 0)
        .filter(t => t.forum_id === this.forum_id)
        .filter(t => this.isToday(t.last_post_time))
        .filter(t => t.title.toLowerCase().includes(this.search.toLowerCase()) || t.author_name.toLowerCase().includes(this.search.toLowerCase()))
        .sort((t1, t2) => {
          if (t1.last_post_time < t2.last_post_time) return 1;
          if (t1.last_post_time > t2.last_post_time) return -1;
          
          return 0;
        })
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
    getTopicPosts(topic) {
      return _.sortBy(topic.author_posts, 'id').filter(post => this.isToday(post.time));
    },
    isToday(time) {
      return moment.parseZone(time).isSame(moment(), 'day');
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
