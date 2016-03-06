var validator = require('is-my-json-valid');
var colors = require('colors');

var schema = require('../../schemas/geojson/geojson');
var ext = {
  schemas : {
    crs : require('../../schemas/geojson/crs'),
    bbox : require('../../schemas/geojson/bbox'),
    geometry : require('../../schemas/geojson/geometry')
  }
};
var validate = validator(schema, ext);

module.exports = function(features, config) {
  var id = config.id || 'id';
  var count = 0;

  features.forEach(function(feature){
    if( !validate(feature) ) {
      if( feature.properties ) {
        console.log(colors.red('Invalid geojson: '+feature.properties[id]));
      } else {
        console.log(colors.red('Invalid geojson: '+JSON.stringify(feature)));
      }
      count++;
    }
  });

  return count;
};
