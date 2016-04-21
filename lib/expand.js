var async = require('async');
var readFile = require('./crawler/readFile');
var readRefs = require('./crawler/readRefs');

function expand(object, properties, callback) {
  if( typeof properties === 'function' ) {
    callback = properties;
    readRefs(null, object, 'properties', {parseCsvData: true}, callback);
    return;
  }
  
  async.forEach(
    properties,
    function(key, next) {
      var keys = key.split('.');
      for( var i = 0; i < keys.length-1; i++ ) {
        if( keys[i].match(/^\d+$/) ) {
          keys[i] = parseInt(keys[i]);
        }

        object = object[keys[i]];
      }
      key = keys[keys.length-1];

      readFile(object[key].$ref, object, key, true, false, next);
    },
    function(err) {
      callback();
    }
  );
}

function init(feature, properties, callback) {
  if( Array.isArray(properties) ) {
    properties = properties.map(function(prop){
     return 'properties.'+prop;
  });
  }
  
  expand(feature, properties, callback);
}

module.exports = init;
