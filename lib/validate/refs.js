var path = require('path');
var fs = require('fs');
var parseCsv = require('csv-parse');
var async = require('async');
var getRefPaths = require('../expand/getRefPaths');

module.exports = function(dir, hobbesFile, json, results, isLink, callback) {
  if( isLink ) {
    json = {
      properties : json
    }
  }

  var objPaths = getRefPaths(json.properties);

  async.eachSeries(objPaths,
    (objPath, next) => {
       verify(dir, hobbesFile, json, objPath, results, next);
    },
    (err) => {
      callback();
    }
  );
}

function verify(dir, hobbesFile, data, objPath, results, callback) {
  var ref = getRef(data, objPath);
  var file = path.join(dir, ref);

  if( !fs.existsSync(file) ) {
    results.addError('REF_ERROR', hobbesFile, `Path ${file} referenced by ${objPath} does not exist`);
    return callback();
  }

  var ext = path.parse(file).ext.toLowerCase();
  if( ext === 'json' ) {

    try {
      JSON.parse(fs.readFileSync(file), 'utf-8');
    } catch(e) {
      results.addError('PARSE_ERROR', hobbesFile, `File ${file} referenced by ${objPath} is not valid JSON`);
    }
    callback();

  } else if( ext === 'csv' ) {

    parseCsv(fs.readFileSync(file, 'utf-8'), {comment: '#', delimiter: ','}, function(err, data) {
      if( err ) {
        results.addError('PARSE_ERROR', hobbesFile, `File ${file} referenced by ${objPath} is not a valid CSV file`);
      }

      callback();
    });

  } else {
    // noop
    callback();
  }

}

function getRef(data, path) {
  var orgPath = path;
  if( typeof path === 'string' ) {
    path = path.split('.');
  }

  for( var i = 0; i < path.length; i++ ) {
    if( data[path[i]] === undefined ) {
      throw new Error(`Invalid data path ${orgPath}`);
    }
    data = data[path[i]];
  }

  return data;
}