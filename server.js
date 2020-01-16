// server.js
// load the server resource and route GET method
const server = require('server')

// get server port from environment or default to 3000
const port = process.env.PORT || 3000

const { get, socket } = require('server/router');
const { render, redirect, file } = require('server/reply');

server({ port }, [
  get('/', ctx => render('index.html')),
  socket('message', ctx => {
    // Send the message to every socket
    ctx.io.emit('message', ctx.data)
  }),
  socket('connect', ctx => {
    console.log('client connected', Object.keys(ctx.io.sockets.sockets))
    ctx.io.emit('count', {msg: 'HI U', count: Object.keys(ctx.io.sockets.sockets).length})
  })
])
  .then(() => console.log(`Server running at http://localhost:${port}`))
