'use strict';

var async = require('async');
var path = require('path');
var fs = require('fs');

var readFile = require('./readFile');
var getPaths = require('../expand/getRefPaths');

function expand(opts, callback) {
  if( !opts.properties ) {
    opts.properties = getPaths(opts.node.properties);
  }

  async.eachSeries(
    opts.properties,
    (objectPath, next) => {
      var refInfo = getRefProp(objectPath, opts.node);

      var filePath;
      if( path.isAbsolute(refInfo.parent[refInfo.attr].$ref) ) {
        filePath = refInfo.parent[refInfo.attr].$ref;
      } else {
        filePath = path.join(opts.repoDir, opts.node.properties.hobbes.repo.path, refInfo.parent[refInfo.attr].$ref);
      }

      if( !fs.existsSync(filePath) ) {
        throw new Error(`$ref ERROR: ${filePath} does not exist for ${JSON.stringify(opts.node, '', '')}`);
      }

      readFile(
        {
          refParent : refInfo.parent,
          refAttr : refInfo.attr,
          path : filePath
        },
        opts,
        () => {
          next();
        }
      );
    },
    (err) => {
      if( err ) {
        throw new Error(err);
      }

      callback();
    }
  );
}

function getRefProp(path, object) {
  path = path.split('.');
  var tmp = object;

  for( var i = 0; i < path.length-2; i++ ) {
    if( !tmp[path[i]] ) {
      throw new Error(`Invalid path '${path.join('.')}' for object: ${JSON.stringify(object)}`);
    }
    
    tmp = tmp[path[i]];
  }

  if( !tmp.$ref ) {
    if( !tmp[path[i]] ) {
      throw new Error(`Path has no $ref '${path.join('.')}' in object: ${JSON.stringify(object)}`);
    }
  }

  return {
    parent : tmp,
    attr : path[path.length-2]
  };
}

function init(opts, callback) {
  if( !opts.node ) {
    throw new Error('Expand() requires node parameter in opts');
  }

  if( opts.properties && Array.isArray(opts.properties) ) {
    opts.properties = opts.properties.map(function(prop){
      prop = 'properties.'+prop;
      if( !prop.match(/\$ref$/) ) prop = prop+'.$ref';
      return prop;
    });
  } else {
    opts.properties = null;
  }
  
  expand(opts, callback);
}

module.exports = init;