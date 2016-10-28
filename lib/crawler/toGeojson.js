var path = require('path');
var fs = require('fs');

module.exports = function(networkFiles) {
  // various lookup indexes for fast creation of network
  var nodePathLookup = {};
  var nodeLookup = {};
  var regionLookup = {};
  var nestedNodesInRegion = {};
  var nestedLinksInRegion = {};
  var childRegions = {};
  var origins = {};
  var terminals = {};

  /**
   * Loop over all regions that were found
   */
  networkFiles.data.region.forEach((f) => {
    // read in JSON data
    f.data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    // set the HOBBES namespace
    setHobbesData(f.data, f, 'region',  networkFiles.dir);
    // Set a lookup for region names (quick lookup for if region exists)
    regionLookup[f.data.properties.hobbes.id] = true;
  });

  /**
   * set the region information for a region.  this requires regionLookup to be 
   * complete.  Thus is as to be run after above loop.
   */
  networkFiles.data.region.forEach((f) => {
    setRegions(f.data, regionLookup);
  });

  /**
   * initalize all discoved nodes
   */
  networkFiles.data.node.forEach((f) => {
    // read in node data
    f.data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    // set the HOBBES namespace
    setHobbesData(f.data, f, 'node', networkFiles.dir);
    // set the region information
    setRegions(f.data, regionLookup);
    // set a quick lookup of node by id
    nodePathLookup[f.path] = f;
    nodeLookup[f.data.properties.hobbes.id] = f.data;
    // create index of all nodes that exist in a region (nested regional nodes included)
    addNestedRegions(f.data, nestedNodesInRegion);
  });

  networkFiles.data.link.forEach((f) => {
    var originPath = fs.realpathSync(path.join(f.path, 'origin'));
    var terminusPath = fs.realpathSync(path.join(f.path, 'terminus'));
    
    var properties = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));

    var origin = nodePathLookup[originPath].data;
    var terminus = nodePathLookup[terminusPath].data;

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

    // create index of all links that exist in a region (nested regional nodes included)
    addNestedRegions(f.data, nestedLinksInRegion);

    /**
     * set origin and terminus data to be assigned to each node
     */
    if( !origins[origin.properties.hobbes.id] ) {
      origins[origin.properties.hobbes.id] = [];
    }
    origins[origin.properties.hobbes.id].push({
      node : terminus.properties.hobbes.id,
      link : properties.hobbes.id
    });

    if( !terminals[terminus.properties.hobbes.id] ) {
      terminals[terminus.properties.hobbes.id] = [];
    }
    terminals[terminus.properties.hobbes.id].push({
      node : origin.properties.hobbes.id,
      link : properties.hobbes.id
    });
  });

  /**
   * Now assign origin and terminus information to the nodes
   */
  networkFiles.data.node.forEach((f) => {
    f.data.properties.hobbes.origins = origins[f.data.properties.hobbes.id] || [];
    f.data.properties.hobbes.terminals = terminals[f.data.properties.hobbes.id] || [];
  });

  /**
   * set the region information for a region.  this requires regionLookup to be 
   * complete.  Thus is as to be run after above loop.
   */
  networkFiles.data.region.forEach((f) => {
    var id = f.data.properties.hobbes.id;
    var nodes = nestedNodesInRegion[id] || [];
    var oList, tList;
    var regionOrigins = [];
    var regionTerminals = [];

    for( var i = 0; i < nodes.length; i++ ) {
      node = nodes[i].properties;

      oList = origins[node.hobbes.id] ? origins[node.hobbes.id].slice(0) : [];
      tList = terminals[node.hobbes.id] ? terminals[node.hobbes.id].slice(0) : [];

      for( var j = oList.length-1; j >= 0; j-- ) {
        var hobbes = nodeLookup[oList[j].node].properties.hobbes;
        if( hobbes.regions.indexOf(id) > -1 || id === hobbes.region ) {
          oList.splice(j, 1);
        }
      }
      for( var j = tList.length-1; j >= 0; j-- ) {
        var hobbes = nodeLookup[tList[j].node].properties.hobbes;
        if( hobbes.regions.indexOf(id) > -1 || id === hobbes.region ) {
          tList.splice(j, 1);
        } 
      }

      oList.forEach(function(info){
        regionOrigins.push({
          link : info.link,
          node : info.node
        });
      });

      tList.forEach(function(info){
        regionTerminals.push({
          link : info.link,
          node : info.node
        });
      });
    }

    f.data.properties.hobbes.terminals = regionTerminals;
    f.data.properties.hobbes.origins = regionOrigins;
    f.data.properties.hobbes.nodes = nodes.map((node) => node.properties.hobbes.id);

    var links = nestedLinksInRegion[id] || [];
    f.data.properties.hobbes.links = links.map((node) => node.properties.hobbes.id);
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

function addNestedRegions(node, nestedRegions) {
  var regions = node.properties.hobbes.regions;
  regions.forEach(function(region) {
    if( !nestedRegions[region] ) {
      nestedRegions[region] = [];
    }
    nestedRegions[region].push(node);
  }.bind(this));

  if( !nestedRegions[node.properties.hobbes.region] ) {
    nestedRegions[node.properties.hobbes.region] = [];
  }
  nestedRegions[node.properties.hobbes.region].push(node);
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