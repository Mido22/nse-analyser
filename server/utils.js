'use strict'

let config = require('../settings/config')
  , Bluebird = require('bluebird')
  , winston = require('winston')
  , log = winston.info.bind(winston)
 


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

function slice(arry, length, key){
  let idx = arry.indexOf(key)
  if(idx == -1) throw new Error('key not found')
  return arry.slice(idx-length, idx)
}

function getProjections({dates, db, field}){
  let projections = {_id:0}, query = {}, result = [], fields, len
  if(dates) query.date = {$in:dates}
  if(field){
    fields = field.split('.')
    len = fields.length
  }
  return db.findAsync(query, projections).then(data => {
    if(!field)  result = data
    else result = data.map(getInnerDatum)
    return result.filter(d => d)
  })  
  function getInnerDatum(datum){
    for(let i=0;i<len&&datum;i++) datum = datum[fields[i]]
    return isNaN(+datum) ? datum : +datum
  }
}

function average(arry){
  return arry.reduce((z,a) => z+a, 0)/arry.length
}

module.exports = {
  sortDates
  , slice
  , getProjections
  , average
}