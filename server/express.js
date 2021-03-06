'use strict'

let express = require('express')
  , path = require('path')
  , fs = require('fs')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , serveStatic = require('serve-static')
  , config = require('../settings/config')
  , app = express()

app.set('port', config.port)
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
config.staticViews.forEach(location => app.use(serveStatic(location))) // load the static files from the dist foler 
app.use((req, res, next) => {  // catch the missing url error
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use((err, req, res, next) => {		// show the error to the user
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: err
  })
})

module.exports = app