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
    forum_id: '',

    search: '',
    loading: false,
    showAll: false,
    last_update: null,
  },
  computed: {
    filteredTopics() {
      return this.topics
        .filter(t => this.isToday(t.last_post_time))
        .filter(t => this.forum_id === '' || t.forum_id === this.forum_id)
        .filter(t => this.showAll ? t.author_posts.length > 0 : this.filterClosePosts(t.author_posts).length > 1)
        .filter(t => t.title.toLowerCase().includes(this.search.toLowerCase()) || t.author_name.toLowerCase().includes(this.search.toLowerCase()))
        .sort((t1, t2) => {
          if (t1.last_post_time < t2.last_post_time) return 1;
          if (t1.last_post_time > t2.last_post_time) return -1;
          
          return 0;
        })
        .sort((t1, t2) => t2.author_posts.length - t1.author_posts.length);
    },
    showForumColumn() {
      return this.forum_id === '';
    },
    forumsMap() {
      return _.keyBy(this.forums, 'id');
    }
  },
  watch: {
    forum_id: function () {
      if (this.forums.length) {
        this.filtersHandler();
      }
    },
    search: function () {
      this.filtersHandler();
    },
    showAll: function () {
      this.filtersHandler();
    }
  },
  methods: {
    loadTopics() {
      this.loading = true;
      axios.get('db/topics.json', { headers: { 'Cache-Control' : 'no-cache' }}).then((response) => {
        this.topics = response.data.topics || [];
        this.last_update = moment.parseZone(response.data.updated_at);
        this.loading = false;
      });
    },
    loadForums() {
      axios.get('db/forums.json', { headers: { 'Cache-Control' : 'no-cache' }}).then((response) => {
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
    filterClosePosts(posts) {
      return posts.filter((post, i) => 
        !i || Math.abs(moment(posts[i-1].time).diff(moment(post.time), 'minutes')) > 15
      );
    },
    filtersHandler() {
      const p = `?f=${this.forum_id}&s=${this.search}&showAll=${this.showAll}`;

      if (this.$router.currentRoute.fullPath != `/${p}`) {
        this.$router.replace(p);
      }
    },
  },
  mounted() {
    if (this.$route) {
      if (this.$route.query.f) {
        this.forum_id = this.$route.query.f;
      }
      if (this.$route.query.s) {
        this.search = this.$route.query.s;
      }
      if (this.$route.query.showAll) {
        this.showAll = this.$route.query.showAll === 'true';
      }
    }

    this.loadForums();
    this.loadTopics();

    try {
      const socket = io();
      socket.on('topics', () => { this.loadTopics() });
      socket.on('reconnect', () => { this.loadTopics() });
    } catch (e) {
      console.error('Socket connection is not available');
    }
  }
});
