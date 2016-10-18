var path = require('path');
var fs = require('fs');

module.exports = function(networkFiles) {
  nodeLookup = {};

  networkFiles.data.node.forEach((f) => {
    f.data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    setHobbesData(f.data, f, 'node', networkFiles.dir);
    
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
    setHobbesData(f.data, f, 'link', networkFiles.dir);

    f.data.properties.hobbes.origin = origin.properties.hobbes.id;
    f.data.properties.hobbes.terminus = terminus.properties.hobbes.id;
  });

  networkFiles.data.region.forEach((f) => {
    f.data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    setHobbesData(f.data, f, 'region',  networkFiles.dir);
  });
}

function setHobbesData(geojson, fileinfo, type, dir) {
  var path = fileinfo.path.replace(dir, '').replace(/^\//,'');

  geojson.properties.hobbes = {
    regions : [],
    repo : {
      path : path,
      filename : fileinfo.file,
      files : []
    },
    type : type,
    id : path
  }
}