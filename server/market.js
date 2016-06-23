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

function stockAvgDiff({
	  stock
	, days = 5
	, date = dates[dates.length-1]
	, stockField = 3}){
	stockField = config.stockFields[3]
	let checkDates = Utils.slice(dates, days, date)
	  , avg
	  , queryObj = {db, dates:checkDates, field: `${stock}.${stockField}`}
	return Utils.getProjections(queryObj).then(results => {
		avg = Utils.average(results)
		log('avg:', avg)
		queryObj.dates = [date]
		return Utils.getProjections(queryObj)
	}).then(result => {
		log('day val = ', result, 'diff: ', result[0] - avg)
		return result[0] - avg
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
        return db.findOneAsync({})
      })
      .then(data => {
        let keys = []
        for(let key in data)
          if(data[key].stock)
            keys.push(key)
        this.stocks = keys
        log('Market ready for analysis...')
        stockAvgDiff({stock: 'ZYLOG-BZ'})
      })
  }
}

module.exports = new Market()