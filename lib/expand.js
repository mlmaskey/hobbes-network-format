var async = require('async');
var readFile = require('./crawler/readFile');

function expand(object, properties, callback) {
  async.forEach(
    properties,
    function(key, next) {
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
