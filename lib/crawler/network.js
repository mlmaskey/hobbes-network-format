'use strict';

var path = require('path');
var extend = require('extend');
var async = require('async');
var readGeoJson = require('./readGeoJson');
var readRefs = require('./readRefs');
var uid;
var options;

function crawl(root, regionLookup, geojson, o, callback) {
  var region, node;
  var lookup = {};
  options = o;
  uid = options.walkerConfig.id;


  for( var i = 0; i < geojson.features.length; i++ ) {
    node = geojson.features[i];

    if( node.$ref ) {
      var newNode = readGeoJson(path.join(root, node.$ref));
      var parts = node.$ref.split('/');
      var type = node.type;
      var filename = parts.splice(parts.length-1, 1)[0];

      newNode.properties.hobbes = {
        regions : [],
        repo : {
          path : parts.join('/'),
          filename : filename
        },
        type : type,
        id : parts.join('/'),
        networkId : newNode.properties[uid]
      };

      var regionPath = extend(false, [], parts);
      for( var j = parts.length-1; j >= 0; j-- ) {
        region = regionLookup[regionPath.join('/')];
        if( region ) {
          region.properties.hobbes.nodes[newNode.properties[uid]] = newNode.properties.hobbes.type;
          newNode.properties.hobbes.regions.push(region.properties.hobbes.id);
        }
        regionPath.splice(j, 1);
      }

      lookup[newNode.properties[uid]] = newNode;
      geojson.features[i] = newNode;
    }
  }

  geojson.features.forEach(function(node){
    setOriginsTerminals(node, geojson.features);
  });

  processLinks(geojson.features, lookup);

  async.eachSeries(
    geojson.features,
    function(feature, next) {
      readRefs(path.join(root, feature.properties.hobbes.repo.path), feature.properties.id, feature, 'properties', options, next);
    },
    callback
  );
}

function setOriginsTerminals(node, nodes) {
  if( node.properties.hobbes.type === 'link' ) {
    return;
  }

  var origins = [];
  var terminals = [];
  for( var i = 0; i < nodes.length; i++ ) {
    if( nodes[i].properties.terminus === node.properties[uid] ) {
      origins.push({
        node : nodes[i].properties.origin,
        link : nodes[i].properties[uid]
      });
    } else if ( nodes[i].properties.origin === node.properties[uid] ) {
      terminals.push({
        node : nodes[i].properties.terminus,
        link : nodes[i].properties[uid]
      });
    }
  }

  node.properties.hobbes.origins = origins;
  node.properties.hobbes.terminals = terminals;
}

function processLinks(nodes, lookup) {
  var removeList = [];

  nodes.forEach(function(node){
    if( node.geometry !== null ) {
      return;
    }

    if( node.properties.origin && node.properties.terminus ) {
      var origin = lookup[node.properties.origin];
      var terminus = lookup[node.properties.terminus];

      if( !origin || !terminus ) {
        if( options.debug ) {
          console.log('Node links are missing: '+node.properties[uid]);
          console.log(node);
        }
        return;
      } else if( !origin.geometry || !terminus.geometry ) {
        if( options.debug ) {
          console.log('Node links are missing geometry: '+node.properties[uid]);
          console.log(node);
        }
        return;
      }

      node.geometry = {
        type : 'LineString',
        coordinates: [
          origin.geometry.coordinates,
          terminus.geometry.coordinates
        ]
      };

    } else {
      if( options.debug ) {
        console.log('Found node with missing origin and/or terminus: '+node.properties[uid]);
        console.log(node);
      }
      removeList.push(node);
    }
  });

  removeList.forEach(function(node){
    nodes.splice(nodes.indexOf(node), 1);
  });
}

module.exports = crawl;
