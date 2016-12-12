var prepareNetwork = require('./prepareNetwork');
var toGeojson = require('./toGeojson');
var expand = require('./expand');
var path = require('path');
var git = require('../git');


function crawler(dir, opts, callback) {
  if( typeof opts === 'function' ) {
    callback = opts;
    opts = {};
  }

  dir = path.resolve(dir);
debugger;
  var networkFiles = prepareNetwork(dir);

  git.info(dir, (repoInfo) => {
      toGeojson(networkFiles, repoInfo);

      expand(networkFiles, opts, () => {
        onComplete(networkFiles, opts, callback);
      });
  });

}

function onComplete(networkFiles, opts, callback) {
  var regionCollection = {
    type : 'FeatureCollection',
    features : []
  };
  var networkCollection = {
    type : 'FeatureCollection',
    features : []
  };

  networkFiles.data.node.forEach((n) => {
    networkCollection.features.push(n.data);
  });

  networkFiles.data.link.forEach((f) => {
    networkCollection.features.push(f.data);
  });

  networkFiles.data.region.forEach((r) => {
    regionCollection.features.push(r.data);
  });

  callback({
      nodes : networkCollection,
      regions : regionCollection
  }, opts);
}

module.exports = crawler;