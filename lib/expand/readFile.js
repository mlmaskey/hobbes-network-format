'use strict';

var parse = require('csv-parse');
var fs = require('fs');

var numMatch1 = /^-?\d+\.?\d*$/;
var numMatch2 = /^-?\d*\.\d+$/;
var numMatch3 = /^-?\d*\.?\d*e-?\d+$/;

module.exports = function(fileInfo, opts, callback) {

  if( !shouldParse(fileInfo.path, opts) ) {
    fileInfo.refParent[fileInfo.refAttr] = {
      $ref : fileInfo.path
    }
    return callback();
  }

  if( fileInfo.path.match(/.*\.csv$/i) ) {
    fs.readFile(fileInfo.path, 'utf-8', (err, data) => {
      if( err ) throw err;

      parse(data, {comment: '#', delimiter: ','}, function(err, data) {
        if( err ) throw err;
        
        fileInfo.refParent[fileInfo.refAttr] = parseInts(data);

        callback();
      });
    });

  } else if( fileInfo.path.match(/.*\.json$/i) ) {
    fs.readFile(fileInfo.path, 'utf-8', (err, data) => {
      if( err ) throw err;

      fileInfo.refParent[fileInfo.refAttr] = eval('('+data+')');
      callback();
    });
  
  } else {
    fs.readFile(fileInfo.path, 'utf-8', (err, data) => {
      if( err ) throw err;

      fileInfo.refParent[fileInfo.refAttr] = data;
      callback();
    });
  }
};

function shouldParse(filePath, opts) {
  if( opts.onlyParse ) {
    return opts.onlyParse(filePath);
  }

  return true;
}

var re = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
function parseInts(data) {
  var i, j, t, ln1, ln2;

  ln1 = data.length;
  for( i = 0; i < ln1; i++ ) {
    ln2 = data[i].length;

    for( j = 0; j < ln2; j++ ) {

      if( data[i][j].match(re) ) {
        t = Number(data[i][j]);
        if( !isNaN(t) ) {
          data[i][j] = t.valueOf();
        }
      }

    }
  }
  return data;
}