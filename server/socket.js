'use strict'

let winston = require('winston')
  , config = require('../settings/config')
  , log = winston.info.bind(winston)

function socketHandler(socket){

  log('socket is connnected...')
}

module.exports = socketHandler