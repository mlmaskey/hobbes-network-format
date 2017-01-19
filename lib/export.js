var crawler = require('./crawler');
var fs = require('fs');
var path = require('path');

module.exports = function(dir, callback) {
  var onlyParse = function(filepath) {
    if( filepath.match(/.*\.js$/i) ) return true;
    return false;
  }

  crawler(dir, {onlyParse}, (network) => { 
    fs.writeFileSync(
      path.join(process.cwd(), 'hobbes_export.geojson'), 
      JSON.stringify(network.nodes, '  ', '  ')
    );
    
    if( callback ) callback();
  });
}
