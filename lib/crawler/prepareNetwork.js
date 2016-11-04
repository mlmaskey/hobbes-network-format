var walk = require('./fast-walk');
var path = require('path');

var re = {
  link : /link.(geojson|json)/i,
  node : /node.(geojson|json)/i,
  region : /region.(geojson|json)/i,
}

module.exports = function(dir) {
  var key, files = walk(dir);
  
  var regionLookup = {};
  var data = {
    region : [],
    node : [],
    link : []
  }

  files.forEach((f) => {
    for( key in re ) {
      if( f.file.match(re[key]) ) {
        addFile(key, f, dir, data, regionLookup);
      }
    }
  });

  process(data, regionLookup);

  return {
    data : data,
    regions : regionLookup,
    dir : dir
  }
}


function addFile(key, fileInfo, dir, data, regionLookup) {
  fileInfo.networkPath = fileInfo.path.replace(dir, '').replace(/^\//,'');
  data[key].push(fileInfo);

  if( key === 'region' ) {
    regionLookup[fileInfo.networkPath] = {
      nodes : [],
      subregions : []
    };
  }
}

function process(data, regionLookup) {
  data.node.forEach((node) => {
    var parts = node.networkPath.split(path.sep);
    var p = parts.slice(0, parts.length-1).join(path.sep);
    if( regionLookup[p] ) {
      regionLookup[p].nodes.push(node.networkPath);
    }
  });

  data.region.forEach((region) => {
    var parts = region.networkPath.split(path.sep);
    for( var i = 0; i < parts.length; i++ ) {
      var p = parts.slice(0, i).join(path.sep);
      if( regionLookup[p] ) {
        regionLookup[p].subregions.push(region.networkPath);
      }
    }
  });
}

