var crawler = require('./lib/crawler');

module.exports = function(path, o, callback) {
  if( typeof o === 'function' ) {
    callback = o;
    o = {};
  }

  var options = {
    parseCsvData: o.parseCsvData || false,
    debug: o.verbose || false,
    reindex : o.reindex || false
  };

  crawler(path, options, function(resp, options){
    callback(resp, options);
  });
};
