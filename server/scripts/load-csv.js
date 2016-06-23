'use strict'

let fs = require('fs')
  , path = require('path')
  , config = require('../../settings/config')
  , csv = require('fast-csv')
  , Bluebird = require('bluebird')
  , winston = require('winston')
  , log = winston.info.bind(winston)
  , db
 

fs = Bluebird.promisifyAll(fs)

function getCsvFiles(){
  return fs.readdirAsync(config.csvFolder)
    .then(files => files.filter(file => file.indexOf('.csv')!=-1).map(file => path.join(config.csvFolder, file)))
}

function deleteCsv(file){
  //if(file.indexOf(config.csvFolder)==-1) file = path.join(config.csvFolder, file)
  return fs.unlinkAsync(file)
}

function readCsv(file){
  let stream = fs.createReadStream(file)
    , open, high, low, close
  return new Promise((resolve, reject) => {
    let csvStream = csv()
      .on('data', data => {        
        count++
        if(!count)  {
          open = data.indexOf('OPEN')
          close = data.indexOf('CLOSE')
          high = data.indexOf('HIGH')
          low = data.indexOf('LOW')
          return
        }
        if(count==1)  {
          let date = data[10].split('-')
          obj.date = data[10]          
          // obj.month = date[1]
          // obj.day = date[0]
          // obj.year = date[2]
        }
        obj[`${data[0]}-${data[1]}`] = {
          stock: true,
          open: data[open],
          high: data[high],
          low: data[low],
          close: data[close]
        }
      })
      .on('end', () => resolve(obj))
      , obj = {}
      , count = -1
    stream.pipe(csvStream)
  })
}

function addCsv(file){
  let data
  return readCsv(file)
    .then(_data => {
      data = _data
      return db.findOneAsync({_id: data._id})
    }).then(record => {
      if(record)  return db.remove({_id: record._id})
    }).then(() => db.insertAsync(data))
    .then(() => deleteCsv(file))
}

function loadCsvs(_db){
	db = _db
  return getCsvFiles()
    .then(files => Bluebird.mapSeries(files, addCsv))
    .then(() => log('loaded all csv files...'))
}

module.exports = loadCsvs