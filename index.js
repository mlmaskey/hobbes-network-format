var crawler = require('./lib/crawler');
var _readFile = require('./lib/expand/readFile');

function crawl(path, o, callback) {
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
}

function readFile(obj, attr, callback) {
  _readFile(obj[attr].$ref, obj, attr, true, false, callback);
}



var hnf = {
  expand : require('./lib/expand'),
  split : require('./lib/split'),
  crawl : crawl,
  aggregate : require('./lib/aggregate'),
  readFile : readFile
};

module.exports = hnf;
