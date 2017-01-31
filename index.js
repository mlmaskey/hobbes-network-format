var crawler = require('./lib/crawler');
var _readFile = require('./lib/expand/readFile');

function crawl(path, o, callback) {
  if( typeof o === 'function' ) {
    callback = o;
    o = {};
  }

  var options = {
    onlyParse: o.onlyParse || false,
    debug: o.verbose || false
  };

  crawler(path, options, function(resp, options){
    callback(resp, options);
  });
}

function readFile(obj, attr, callback) {
  _readFile(
    {
      refParent : obj,
      refAttr : attr,
      path : obj[attr].$ref
    },
    {},
    callback
  );
}



var hnf = {
  expand : require('./lib/expand'),
  validate : require('./lib/validate'),
  crawl : crawl,
  readFile : readFile,
  split : require('./lib/split')
};

module.exports = hnf;
