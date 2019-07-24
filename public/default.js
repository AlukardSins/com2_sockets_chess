var board
var game
var socket = io()

window.onload = function () {
  initGame()
}

var initGame = function () {
  var cfg = {
    draggable: true,
    position: 'start',
    onDrop: handleMove
  }

  board = new ChessBoard('gameBoard', cfg)
  game = new Chess()
}

var handleMove = function (source, target) {
  var move = game.move({ from: source, to: target })

  if (move === null) return 'snapback'
  else socket.emit('move', move)
}

socket.on('move', function (msg) {
  game.move(msg)
  board.position(game.fen()) // fen is the board layout
})

//  Rooms logic
socket.on('connect', function () {
  socket.emit('adduser', prompt("What's your name: "))
})

socket.on('updatechat', function (username, data) {
  $('#conversation').append('<b>' + username + ':</b> ' + data + '<br>')
})

socket.on('updaterooms', function (rooms, currentRoom) {
  $('#rooms').empty()
  $.each(rooms, function (key, value) {
    if (value === currentRoom) {
      $('#rooms').append('<div>' + value + '</div>')
    } else {
      $('#rooms').append('<div><a href="#" onclick="switchRoom(\'' + value + '\')">' + value + '</a></div>')
    }
  })
})

function switchRoom (room) {
  socket.emit('switchRoom', room)
}

$(function () {
  $('#datasend').click(function () {
    var message = $('#data').val()
    $('#data').val('')
    socket.emit('sendchat', message)
  })

  $('#data').keypress(function (e) {
    if (e.which === 13) {
      $(this).blur()
      $('#datasend').focus().click()
    }
  })

  $('#roombutton').click(function () {
    var name = $('#roomname').val()
    $('#roomname').val('')
    socket.emit('create', name)
  })
})
