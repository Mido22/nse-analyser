'use strict'

let app = require('./express')
  , http = require('http')
  , winston = require('winston')
  , open = require('open')
  , IO = require('socket.io')
  , config = require('../settings/config')
  , Market = require('./utils')
  , socketHandler = require('./socket')
  , port = config.port
  , server

server = http.createServer(app)

server.listen(port)
server.on('error', e => winston.info('server error: ', e))
server.on('listening', () => {
	winston.info('server listenng to port: ', port)
	Market.ready.then(() => open(`http://localhost:${port}`))
})

let io = IO(server)

io.on('connection', socketHandler)

module.exports = server