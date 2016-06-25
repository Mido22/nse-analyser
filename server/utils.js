'use strict'

let config = require('../settings/config')
  , Bluebird = require('bluebird')
  , winston = require('winston')
  , fs = require('fs')
  , log = winston.info.bind(winston)
 
fs = Bluebird.promisifyAll(fs)

function sortDates(arry){
  let months = config.months
    , conv  = a => {
      a = a.split('-')
      a[1] = months.indexOf(a[1])
      if(a[1]==-1)  throw new Error('Incorrect Date')
      return (+a[0]) + a[1]*100 + (+a[2])*10000
    }
  return arry.sort((a,b) => conv(a) - conv(b))
}

function slice(arry, length, key, includeKey){
  let idx = arry.indexOf(key)
  if(idx == -1) throw new Error('key not found')
  if(includeKey) idx++
  return arry.slice(idx-length, idx)
}

function average(arry){
  return arry.reduce((z,a) => z+a, 0)/arry.length
}

function getRSI(arry){
  let posArry = []
    , negArry = []
    , RSI = 100 

  arry.forEach((val, idx) => {
    if(!idx)  return
    val -= arry[idx-1]
    val>0 ? posArry.push(val): negArry.push(-1*val)
  })
  if(!negArry.length) return RSI
  return RSI - 100/(1+ (average(posArry)/average(negArry)))
}

function writeJSON(obj, file){
  obj = JSON.stringify(obj, null, 4)
  return fs.writeFileAsync(file, obj)
}

module.exports = {
  sortDates
  , slice
  , average
  , getRSI
  , writeJSON
}