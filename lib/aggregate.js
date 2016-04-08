var async = require('async');
var expand = require('./expand');

function aggregate(features, aggModule, callback) {

  var base = {};
  if( aggModule.init ) {
     aggModule.init(base);
  }

  async.forEach(
    features,
    function(feature, next) {
      if( aggModule.expand ) {
        expand(feature, aggModule.expand, function(){
          aggModule.aggregate(feature, base, next);
        });
      } else {
        aggModule.aggregate(feature, base, next);
      }
    },
    function(err) {
      if( aggModule.finalize ) {
        aggModule.finalize(base);
      }

      callback();
    }
  );
}

module.exports = aggregate;
