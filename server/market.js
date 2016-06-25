'use strict'

let config = require('../settings/config')
  , Bluebird = require('bluebird')
  , winston = require('winston')
  , Datastore = require('nedb')
  , Utils = require('./utils')
  , loadCsvs = require('./scripts/load-csv')
  , log = winston.info.bind(winston)
  , db = new Datastore(config.datastore)
  , dates
 
db = Bluebird.promisifyAll(db)

function stockAvgDiff({ stock, days, date, stockField}){
	stockField = config.stockFields[stockField]
	let checkDates = Utils.slice(dates, days, date)
	  , avg
	  , field = `${stock}.${stockField}`
	  , queryObj = {dates:checkDates, field}
	return getProjections(queryObj).then(results => {
		avg = Utils.average(results)
		queryObj.dates = [date]
		return getProjections(queryObj)
	}).then(result => {
		log(stock, result[0]-avg)
		return result[0] - avg
	})
}

function getProjections({dates, field}){
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

function getRSI({stock, days, date, stockField}){
	stockField = config.stockFields[stockField]
	let checkDates = Utils.slice(dates, days, date, true)
	  , field = `${stock}.${stockField}`
	  , monad = time => getProjections({dates:[time], field}).then(result => result[0]) 
	return Bluebird.mapSeries(checkDates, monad).then(results => {
		return Utils.getRSI(results)
	})
}

function getStocks(date){
  return db.findOneAsync({date}).then(data => {
    let stocks = []
    for(let key in data)
      if(data[key].stock)
        stocks.push(key)
    return stocks     
  })
}

//ZYLOG-EQ

class Market{
  constructor(){
    this.db = db
    this.ready = db
      .loadDatabaseAsync()
      .then(() => db.ensureIndexAsync({fieldName:'date', unique: true, sparse: true}))
      .then(() => log('database is loaded...'))
      .then(() => loadCsvs(db))
      .then(() => db.findAsync({}, {date:1, _id:0}))
      .then(data => {
        data = data.map(datum => datum.date)
        dates = Utils.sortDates(data)
        this.dates = dates
        log('Market ready for analysis...')
        // return this.getStockRSIs({days: 5})
      }).then(d => log('res: ', d))
  }
  getStockAvgDiffs({stocks, days = 89, date=dates[dates.length-1], stockField = 3}){
  	
  	let monad = stock => stockAvgDiff({stock, days, date, stockField}).then(val => data.push({stock, val}))
  	  , data = []
  	  , chain = stocks? Promise.resolve(stocks) : getStocks(date)

  	return chain.then(stocks => Bluebird.mapSeries(stocks, monad))
  	  .then(() => data.filter(a => !isNaN(a.val)))
  }
  getStockRSIs({stocks, days = 5, date=dates[dates.length-1], stockField = 3}){
  	
  	let monad = stock => getRSI({stock, days, date, stockField}).then(val => data.push({stock, val}))
  	  , data = []
  	  , chain = stocks? Promise.resolve(stocks) : getStocks(date)

  	return chain.then(stocks => Bluebird.mapSeries(stocks, monad))
  	  .then(() => data.filter(a => !isNaN(a.val)))
  }
}

module.exports = new Market()