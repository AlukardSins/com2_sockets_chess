var express = require('express')
var app = express()
app.use(express.static('public'))
var http = require('http').Server(app)
var io = require('socket.io')(http)
var path = require('path')
var port = process.env.PORT || 8080

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/default.html'))
})

http.listen(port, function () {
  console.log('listening on: ' + port)
})

io.on('connect', function (socket) {
  console.log('My lord, a new opponent arrives.')

  socket.on('move', function (msg) {
    socket.broadcast.emit('move', msg)
  })

  socket.on('disconnect', function () {
    console.log('The opponent flees, my lord.')
  })
})

// Rooms logic
var usernames = {}

var rooms = [
  'Lobby'
]

io.sockets.on('connection', function (socket) {
  socket.on('adduser', function (username) {
    socket.username = username
    socket.room = 'Lobby'
    usernames[username] = username
    socket.join('Lobby')
    socket.emit('updatechat', 'SERVER', 'you have connected to Lobby')
    socket.broadcast.to('Lobby').emit('updatechat', 'SERVER', username + ' has connected to this room')
    socket.emit('updaterooms', rooms, 'Lobby')
  })

  socket.on('create', function (room) {
    rooms.push(room)
    socket.emit('updaterooms', rooms, socket.room)
  })

  socket.on('sendchat', function (data) {
    io.sockets['in'](socket.room).emit('updatechat', socket.username, data)
  })

  socket.on('switchRoom', function (newroom) {
    var oldroom
    oldroom = socket.room
    socket.leave(socket.room)
    socket.join(newroom)
    socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom)
    socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room')
    socket.room = newroom
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room')
    socket.emit('updaterooms', rooms, newroom)
  })

  socket.on('disconnect', function () {
    delete usernames[socket.username]
    io.sockets.emit('updateusers', usernames)
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected')
    socket.leave(socket.room)
  })
})
