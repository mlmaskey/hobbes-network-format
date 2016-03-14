var crawler = require('./lib/crawler');

module.exports = function(o) {
  var options = {
    parseCsvData: o.parseCsvData || false,
    debug: o.verbose || false,
    reindex : o.reindex || false
  };

  crawler(program.directory, options, function(resp, options){
    onCrawlComplete(resp, options);
  });
};
