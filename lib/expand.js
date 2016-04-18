var async = require('async');
var readFile = require('./crawler/readFile');

function expand(object, properties, callback) {
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
  expand(feature.properties, properties, callback);
}

module.exports = init;
