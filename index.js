var crawler = require('./lib/crawler');

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



var hnf = {
  expand : require('./lib/expand'),
  split : require('./lib/split'),
  crawl : crawl,
  aggregate : require('./lib/aggregate')
};

module.exports = hnf;
