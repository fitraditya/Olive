var _ = require('lodash-node')

var users = []
var sessions = {}

exports.register = function (server, options, next) {
  var io = require('socket.io')(server.select('signal').listener)

  io.on('connection', function (socket) {

    socket.on('register', function (data) {
      if (_.findIndex(users, { socket: socket.id }) !== -1) {
        socket.emit('register_error', { message: 'You are already registered.' })
        return
      }

      users.push({
        socket: socket.id,
        session: data.session
      })

      if (data.isInitiator) {
        sessions[data.session] = {
          initiator: socket.id,
          users: []
        }
      }
      sessions[data.session].users.push(socket.id)

      socket.emit('registered', {
        socket: socket.id,
        session: data.session,
        users: sessions[data.session].users
      })

      console.log('- ' + socket.id + ' registered, session ' + data.session)
      console.log(sessions[data.session])
    })

    socket.on('invite', function (data) {
      var user = _.find(users, { socket: socket.id })
      if (!user) { return }

      var target = _.find(users, { socket: data.target })
      if (!target) { return }

      io.to(target.socket).emit('invited', {
        id: socket.id
      })
    })

    socket.on('message', function (data) {
      var user = _.find(users, { socket: socket.id })
      if (!user) { return }

      var target = _.find(users, { socket: data.target })
      if (!target) { return }

      io.to(target.socket).emit('message', {
        id: socket.id,
        message: data.message
      })
    })

    socket.on('disconnect', function () {
      var index = _.findIndex(users, { socket: socket.id })

      if (index !== -1) {
        users.splice(index, 1)
        console.log('- ' + socket.id + ' disconnected.')
      }
    })

  })

  next()
}

exports.register.attributes = {
  name: 'olive-signal'
}
