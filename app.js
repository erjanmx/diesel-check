
new Vue({
  el: '#app',
  data: {
    topics: [],
    check_forum_id: 0,
  },
  methods: {
    loadTopics: function () {
      axios.get('/topics').then(
        response => this.topics = response.data
      )
    },
    loadForum: function () {
      axios.get('/forum/get').then(
        response => this.check_forum_id = response.data
      )
    },
    onForumChange(event) {
      axios.get('/forum/set?id=' + event.target.value).then(() => this.loadTopics());
    }
  },
  mounted() {
    this.loadForum();
    this.loadTopics();
  }
});
