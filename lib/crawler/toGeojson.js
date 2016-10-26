var path = require('path');
var fs = require('fs');

module.exports = function(networkFiles) {
  var nodeLookup = {};
  var regionLookup = {};
  var childRegions = {};

  networkFiles.data.region.forEach((f) => {
    f.data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    setHobbesData(f.data, f, 'region',  networkFiles.dir);
    regionLookup[f.data.properties.hobbes.id] = true;
  });

  networkFiles.data.region.forEach((f) => {
    setRegions(f.data, regionLookup);
  });

  networkFiles.data.node.forEach((f) => {
    f.data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    setHobbesData(f.data, f, 'node', networkFiles.dir);
    setRegions(f.data, regionLookup);
    nodeLookup[f.path] = f;
  });

  networkFiles.data.link.forEach((f) => {
    var originPath = fs.realpathSync(path.join(f.path, 'origin'));
    var terminusPath = fs.realpathSync(path.join(f.path, 'terminus'));
    
    var properties = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));

    var origin = nodeLookup[originPath].data;
    var terminus = nodeLookup[terminusPath].data;

    f.data = {
      geometry : {
        type : 'LineString',
        coordinates : [
          origin.geometry.coordinates,
          terminus.geometry.coordinates
        ]
      },
      properties : properties
    }
    setHobbesData(f.data, f, 'link', networkFiles.dir, regionLookup);

    f.data.properties.hobbes.origin = origin.properties.hobbes.id;
    f.data.properties.hobbes.terminus = terminus.properties.hobbes.id;
    setRegions(f.data, regionLookup);
  });
}

function setRegions(node, regions) {
  if( node.properties.hobbes.type !== 'link' ) {
    var info = getRegions(node.properties.hobbes.id, regions);
    node.properties.hobbes.regions = info.list;
    node.properties.hobbes.region = info.parent;
  } else {
    var list1 = getRegions(node.properties.hobbes.origin, regions).list;
    var list2 = getRegions(node.properties.hobbes.terminus, regions).list;

    list2.forEach((r) => {
      if( list1.indexOf(r) === -1 ) {
        list1.push(r);
      }
    });
    node.properties.hobbes.regions = list1;
  }
}

function getRegions(id, regions) {
  var parts = id.split('/');
  var path = [];
  var list = [];
  var parent = '';

  for( var i = 0; i < parts.length; i++ ) {
    path.push(parts[i]);
    var region = path.join('/');
    if( regions[region] ) {
      list.push(region);
      if( i < parts.length-1 ) parent = region;
    }
  }

  return {
    list: list,
    parent : parent
  };
}

function setHobbesData(geojson, fileinfo, type, dir) {
  var path = fileinfo.path.replace(dir, '').replace(/^\//,'');

  geojson.properties.hobbes = {
    regions : [],
    region : '',
    repo : {
      path : path,
      filename : fileinfo.file,
      files : []
    },
    type : type,
    id : path
  }
}