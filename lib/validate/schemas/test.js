//var tv4 = require('tv4');
var validator = require('is-my-json-valid');

//var schema = tv4.getSchema('file://'+__dirname+'/geojson/geojson.json');
var schema = require('./geojson/geojson');

var ext = {
  schemas : {
    crs : require('./geojson/crs'),
    bbox : require('./geojson/bbox'),
    geometry : require('./geojson/geometry')
  }
};

var geojson = {
  type : 'Feature',
  geometry : {
    type : 'Poin',
    coordinates : [0,0]
  },
  properties : {
    id : '1234'
  }
};

//var valid = tv4.validateMultiple(data, schema);
var validate = validator(schema, ext);
console.log(validate(geojson));
console.log(validate.errors);
