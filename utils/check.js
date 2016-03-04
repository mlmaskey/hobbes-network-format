'use strict';

var crawler = require('../lib/crawler');
var data = '/Users/jrmerz/dev/watershed/calvin-network-data/data';

var t = new Date().getTime();

var options = {
  parseCsvData: false,
  alwaysParse : alwaysParse,
  debug: true,
  reindex : false
};

crawler(data, options, function(resp){
  resp.nodes.features.forEach(function(node){
  //  console.log(node.properties);
  //  console.log();
  });
  console.log(new Date().getTime()-t);
});

function alwaysParse(geojson) {
  if( geojson.bound !== undefined && (geojson.type === 'UBM' || geojson.type === 'LBM') ) {
    return true;
  }
  return false;
}
