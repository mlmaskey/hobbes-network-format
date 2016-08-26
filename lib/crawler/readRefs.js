'use strict';

var async = require('async');
var readFile = require('./readFile');
var path = require('path');

// process $ref pointers
function readRefs(dir, obj, attr, options, callback) {
  if( !options.files ) {
    options.files = [];
  }
  if( !options.path ) {
    options.path = [];
  }
  options.path.push(attr);

  var keys;
  try {
    keys = Object.keys(obj[attr]);
  } catch(e) {
    debugger;
  }
  
  async.eachSeries(keys,
    function(key, next) {

      if( key === '$ref' ) {
        try {
          var file;

          // handle files with local path ie: ./path
          if( !path.isAbsolute(obj[attr].$ref) ) {
            options.files.push({
                path : obj[attr].$ref,
                property : options.path.join('.')+'.$ref'
            });
            file = path.join(dir, obj[attr].$ref);
            readFile(file, obj, attr, shouldParse(obj, options), options.debug, next);
            return;

          // handle full path
          } else {
            options.files.push({
                path : obj[attr].$ref,
                property : options.path.join('.')+'.$ref'
            });
            readFile(obj[attr].$ref, obj, attr, shouldParse(obj, options), options.debug, next);
            return
          }
        } catch(e) {
          if( options.debug ) {
            console.log('  --Unabled to read: "'+file+'" ('+obj[attr].$ref+') '+JSON.stringify(parts));
          }
          obj[attr] = 'Unabled to read: '+file;
        }

      } else if( typeof obj[attr][key] === 'object' && obj[attr][key] !== null ) {
        return readRefs(dir, obj[attr], key, options, next);
      }

      next();
    },
    function() {
      options.path.pop();
      callback();
    }
  );
}


// when running show commands, we don't parse csv data.  That said, the Monthly
// csv data is required for show commands.  so even if the flag is set to false
// parse monthly bounds
function shouldParse(obj, options) {
  if( options.alwaysParse && options.alwaysParse(obj) ) {
    return true;
  }

  return options.parseCsvData;
}

module.exports = readRefs;
