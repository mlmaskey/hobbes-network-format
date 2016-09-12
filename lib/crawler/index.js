'use strict';

var fs = require('fs');
var path = require('path');
var walk = require('./fast-walk');
var readGeoJson = require('./readGeoJson');
var regionsImporter = require('./regions');
var networkImporter = require('./network');
var escapeStringRegexp = require('escape-string-regexp');
var git = require('../git');

var regions = {};
var regionCollection = {
  type : 'FeatureCollection',
  features : []
};
var networkCollection = {
  type : 'FeatureCollection',
  features : []
};

var config = {
  id : 'id',
  regionId : 'id',
  region : 'region.geojson',
  node : 'node.geojson',
  link : 'link.geojson'
};

/**
Options:
parseCsvData : Boolean,
alwaysParse : Function,
debug : Boolean,
**/

function walkDir(dir, options, callback) {
  reset();

  if( typeof options === 'function' ) {
    callback = options;
    options = {};
  }

  if( options.parseCsvData === undefined ) {
    options.parseCsvData = false;
  }

  // read in custom config
  if( fs.existsSync(path.join(dir, 'conf.json')) ) {
    var tmp = require(path.join(dir, 'conf.json'));
    for( var key in tmp ) {
      config[key] = tmp[key];
    }
  }
  options.walkerConfig = config;

  // reindexing is now super fast
  // options.reindex = true;

  // if( !options.reindex && fs.existsSync(path.join(dir, 'regions.geojson')) && fs.existsSync(path.join(dir, 'network.geojson')) ) {
  //   if( options.debug ) {
  //     console.log('Using cached index geojson files');
  //   }
  //   regionCollection = readGeoJson(path.join(dir, 'regions.geojson'));
  //   networkCollection = readGeoJson(path.join(dir, 'network.geojson'));

  //   return crawler(dir, options, callback);
  // }

  // if( options.debug ) {
  //   console.log('Creating cache index geojson files');
  // }

  // var walker = walk.walk(dir, {});
  var startPathSepRegex = new RegExp('^'+escapeStringRegexp(path.sep));
  var pathRepRegex = new RegExp(escapeStringRegexp(path.sep),'g');

  var c = 0;
  var t = new Date().getTime();

  var files = walk(dir);
  var file = {}, isRegion = false, type = '', name = '', root = '';
  for( var i = 0; i < files.length; i++ ) {
    file = files[i];

    isRegion = false;
    type = '';
    name = file.file;
    root = file.path;
    c++;

    if( name === config.region ) {
      isRegion = true;
    } else if( name === config.link ) {
      type = 'link';
    } else if ( name === config.node ) {
      type = 'node';
    } else {
      continue;
    }

    var filepath = path.join(root.replace(dir, ''), name);
    if( filepath.match(startPathSepRegex) ) {
      filepath = filepath.replace(startPathSepRegex, '');
    }

    var ref = {
      // always save as unix style path
      $ref : filepath.replace(pathRepRegex, '/')
    };

    if( isRegion ) {
      regionCollection.features.push(ref);
    } else {
      ref.id = root.split(path.sep).pop();
      ref.type = type;
      networkCollection.features.push(ref);
    }
  }


  // if( fs.existsSync(path.join(dir, 'regions.geojson')) ) {
  //   fs.unlink(path.join(dir, 'regions.geojson'));
  // }
  // fs.writeFileSync(path.join(dir, 'regions.geojson'), JSON.stringify(regionCollection, '  ', '  '));

  // if( fs.existsSync(path.join(dir, 'network.geojson')) ) {
  //   fs.unlink(path.join(dir, 'network.geojson'));
  // }
  // fs.writeFileSync(path.join(dir, 'network.geojson'), JSON.stringify(networkCollection, '  ', '  '));

  crawler(dir, options, callback);

}

function crawler(dir, options, callback) {

  var regionLookup = regionsImporter(dir, regionCollection);
  networkImporter(dir, regionLookup, networkCollection, options, function(){
    git.info(dir, function(gitInfo) {

      var key;
      regionCollection.features.forEach(function(f){
        for( key in gitInfo ){
          f.properties.hobbes.repo[key] = gitInfo[key];
        }
      });
      networkCollection.features.forEach(function(f){
        for( key in gitInfo ){
          f.properties.hobbes.repo[key] = gitInfo[key];
        }
      });

      callback({
        nodes : networkCollection,
        regions : regionCollection
      }, options);

    });
  });
}

function reset() {
  regions = {};
  regionCollection = {
    type : 'FeatureCollection',
    features : []
  };
  networkCollection = {
    type : 'FeatureCollection',
    features : []
  };
}

module.exports = walkDir;
