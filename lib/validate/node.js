var fs = require('fs');
var validator = require('is-my-json-valid');
var validateRefs = require('./refs');

var schema = require('./schemas/geojson/geojson');
var ext = {
  schemas : {
    crs : require('./schemas/geojson/crs'),
    bbox : require('./schemas/geojson/bbox'),
    geometry : require('./schemas/geojson/geometry')
  }
};

module.exports = function(dir, hobbesFile, results, callback) {
  var json = fs.readFileSync(hobbesFile, 'utf-8');

  try {
    json = JSON.parse(json);
  } catch(e) {
    results.addError('PARSE_ERROR', hobbesFile, 'Node file is not valid JSON');
    return callback();
  }

  var validate = validator(schema, ext);
  if( !validate(json) ) {
    results.addError('PARSE_ERROR', hobbesFile, 'Node file is not valid GEOJSON');
    return callback();
  }

  if( json.type !== 'Feature' ) {
    results.addError('PARSE_ERROR', hobbesFile, 'Node file geojson is not of type "Feature"');
    return callback();
  }

  if( !json.geometry ) {
    results.addError('PARSE_ERROR', hobbesFile, 'Node file geojson has no geometry');
  } else if( json.geometry.type !== 'Point' ) {
    results.addError('PARSE_ERROR', hobbesFile, 'Node file geojson geometry is not of type "Point"');
  }

  validateRefs(dir, hobbesFile, json, results, false, callback);
}