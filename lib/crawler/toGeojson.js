var path = require('path');
var extend = require('extend');
var getRefPaths = require('../expand/getRefPaths');
var fs = require('fs');

module.exports = function(networkFiles, repoInfo) {

  // os check
  var isWin = process.platform.match(/win32/i);

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
    setHobbesData(f.data, f, 'region',  networkFiles.dir, repoInfo);
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
    setHobbesData(f.data, f, 'node', networkFiles.dir, repoInfo);
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

    var origin = nodePathLookup[originPath];
    var terminus = nodePathLookup[terminusPath];

    // if we are in windowz, need to do this to read symbolic links.
    if( isWin && (!origin || !terminus) ) {
      originPath = path.resolve(path.join(f.path, fs.readFileSync(originPath, 'utf-8')));
      terminusPath = path.resolve(path.join(f.path, fs.readFileSync(terminusPath, 'utf-8')));

      origin = nodePathLookup[originPath];
      terminus = nodePathLookup[terminusPath];
    }

    origin = origin.data;
    terminus = terminus.data;

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
    setHobbesData(f.data, f, 'link', networkFiles.dir, repoInfo);

    f.data.properties.hobbes.origin = origin.properties.hobbes.id;
    f.data.properties.hobbes.terminus = terminus.properties.hobbes.id;
    setRegions(f.data, regionLookup);

    // create index of all links that exist in a region (nested regional nodes included)
    addNestedRegions(f.data, nestedLinksInRegion);

    /**
     * set origin and terminus data to be assigned to each node
     */
    if( !origins[terminus.properties.hobbes.id] ) {
      origins[terminus.properties.hobbes.id] = [];
    }
    origins[terminus.properties.hobbes.id].push({
      node : origin.properties.hobbes.id,
      link : properties.hobbes.id
    });

    if( !terminals[origin.properties.hobbes.id] ) {
      terminals[origin.properties.hobbes.id] = [];
    }
    terminals[origin.properties.hobbes.id].push({
      node : terminus.properties.hobbes.id,
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
    if( nestedRegions[region].indexOf(node) === -1 ) {
      nestedRegions[region].push(node);
    }
  }.bind(this));

  if( !nestedRegions[node.properties.hobbes.region] ) {
    nestedRegions[node.properties.hobbes.region] = [];
  }
  if( nestedRegions[node.properties.hobbes.region].indexOf(node) === -1 ) {
    nestedRegions[node.properties.hobbes.region].push(node);
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

function setHobbesData(geojson, fileinfo, type, dir, repoInfo) {
  var path = fileinfo.path.replace(dir, '').replace(/^\//,'');

  var repo = extend(true, {}, repoInfo);
  repo.path = path;
  repo.filename = fileinfo.file;
  repo.files = getFiles(geojson);

  geojson.properties.hobbes = {
    regions : [],
    region : '',
    repo : repo,
    type : type,
    id : path
  }
}

function getFiles(geojson) {
  return getRefPaths(geojson.properties)
                .map((p) => getPath(geojson, p));
}

function getPath(geojson, p) {
  var i, parts = p.split('.');
  for( i = 0; i < parts.length; i++ ) {
    geojson = geojson[parts[i]];
  }
  return {
    path : geojson,
    attribute : p
  }
}