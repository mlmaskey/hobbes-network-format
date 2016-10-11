'use strict';

var parse = require('csv-parse');
var fs = require('fs');

var numMatch1 = /^-?\d+\.?\d*$/;
var numMatch2 = /^-?\d*\.\d+$/;
var numMatch3 = /^-?\d*\.?\d*e-?\d+$/;

module.exports = function(fileInfo, opts, callback) {

  if( !shouldParse(fileInfo.path, opts) ) {
    fileInfo.ref.$ref = fileInfo.path;
    return callback();
  }

  if( fileInfo.path.match(/.*\.csv$/i) ) {
    fileInfo.refParent[fileInfo.refAttr] = fs.readFileSync(fileInfo.path, 'utf-8');

    parse(fileInfo.refParent[fileInfo.refAttr], {comment: '#', delimiter: ','}, function(err, data){
      if( err ) {
        fileInfo.refParent[fileInfo.refAttr] = err;
      } else {
        fileInfo.refParent[fileInfo.refAttr] = parseInts(data);
      }

      callback();
    });

  } else if( fileInfo.path.match(/.*\.json$/i) ) {
    
    fileInfo.refParent[fileInfo.refAttr] = require(fileInfo.path);
    callback();
  
  } else {
  
    fileInfo.refParent[fileInfo.refAttr] = fs.readFileSync(fileInfo.path, 'utf-8');
    callback();
  
  }
};

function shouldParse(filePath, opts) {
  if( opts.onlyParse ) {
    return opts.onlyParse(filePath);
  }

  return true;
}


function parseInts(data) {
  for( var i = 0; i < data.length; i++ ) {
    for( var j = 0; j < data[i].length; j++ ) {
      if( data[i][j].match(numMatch1) || data[i][j].match(numMatch2) || data[i][j].match(numMatch3) ) {
        var t = Number(data[i][j]);
        if( !isNaN(t) ) {
          data[i][j] = t.valueOf();
        }
      }
    }
  }
  return data;
}