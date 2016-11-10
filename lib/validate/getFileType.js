var path = require('path');

module.exports = function(file) {
  file = path.parse(file).base;

  if( file.match(/^node\.(geojson|json)$/i) ) {
    return 'node';
  }

  if( file.match(/^link\.(geojson|json)$/i) ) {
    return 'link';
  }

  if( file.match(/^region\.(geojson|json)$/i) ) {
    return 'region';
  }

  return null;
}