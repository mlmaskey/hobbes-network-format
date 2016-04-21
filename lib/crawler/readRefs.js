'use strict';

var async = require('async');
var readFile = require('./readFile');
var path = require('path');

// process $ref pointers
function readRefs(dir, obj, attr, options, callback) {
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
          if( obj[attr].$ref.match(/^\.\/.*/) ) {
            file = path.join(dir, obj[attr].$ref.replace(/^\.\//,''));
            // parts.push(obj[attr].$ref.replace(/^\.\//,''));
            readFile(file, obj, attr, shouldParse(obj, options), options.debug, next);
            return;

          // handle full path
          } else if ( obj[attr].$ref.match(/^\//) ) {
            readFile(obj[attr].$ref, obj, attr, shouldParse(obj, options), options.debug, next);
            return
            
          } else {
            file = path.join(dir, obj[attr].$ref);
            // parts.push(filename);
            // parts.push(obj[attr].$ref);

            readFile(file, obj, attr, shouldParse(obj, options), options.debug, next);
            return;
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
