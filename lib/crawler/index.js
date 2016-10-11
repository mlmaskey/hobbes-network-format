var prepareNetwork = require('./prepareNetwork');
var toGeojson = require('./toGeojson');
var expand = require('./expand');


var dir = '/Users/jrmerz/dev/watershed/calvin-network-data-v2/data';

var networkFiles = prepareNetwork(dir);
toGeojson(networkFiles);

expand(networkFiles, () => {
  console.log('done');

  networkFiles.data.link.forEach((f) => {
    console.log(f.data.properties);
  });
});