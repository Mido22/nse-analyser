'use strict'

let theModule = angular.module('theModule', ['ui.bootstrap'])
  .value('partialsDir', 'html/partials/')

window.socket = io()


