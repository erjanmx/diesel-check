
new Vue({
  el: '#app',
  data: {
    topics: [],
  },
  methods: {
    loadTopics: function () {
      axios.get('/topics').then(
        response => this.topics = response.data
      )
    },
  },
  mounted() {
    this.loadTopics();
  }
});
