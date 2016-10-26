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