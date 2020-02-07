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
  },
  mounted() {    
    this.loadActiveForum();
    
    socket.on('topics', () => { this.loadTopics() });
  }
});
