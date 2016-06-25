'use strict'

let winston = require('winston')
  , config = require('../settings/config')
  , params = require('../settings/rules')
  , Market = require('./market')
  , Utils = require('./utils')
  , log = winston.info.bind(winston)
  , stocks

console.log(params)

return Market.ready
  .then(() => {
    if(!params.rsi) return
    let rsi = params.rsi
      , days = rsi.days
      , check = getFilterFn(rsi)
    return Market.getStockRSIs({days}).then(s => {log(s);return s}).then(_stocks => stocks = _stocks.filter(check).map(a => a.stock))
  }).then(()=>{
    if(!params.avg)  return
    let avg = params.avg
      , days = avg.days
      , check = getFilterFn(avg)
    return Market.getStockAvgDiffs({stocks, days}).then(_stocks => stocks = _stocks.filter(check).map(a => a.stock))
  }).then(()=>{
    return Utils.writeJSON(params.output, stocks)
  })

function getFilterFn(rule){
  let check
  if(rule.max && rule.min)  check = a => (a.val<=rule.max && a.val>=rule.min)
  else if(rule.max) check = a => a.val<=rule.max
  else if(rule.min) check = a => a.val>=rule.min
  else  check = a => a
  return check
}