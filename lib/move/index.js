var fs = require('fs');
var path = require('path');
var getType = require('../validate/getFileType');
var moveNode = require('./node');
var moveLink = require('./link');

module.exports = function(rootDir, from, to, callback) {
  from = path.join(rootDir, from);
  to = path.join(rootDir, to);

  if( !fs.existsSync(from) ) {
    throw new Error(`Directory does not exist: ${from}`);
  } else if( !fs.statSync(from).isDirectory() ) {
    throw new Error(`${from} is not a directory`);
  } else if( fs.existsSync(to) ) {
    throw new Error(`Directory already exists: ${to}`);
  }

  var fileType, nodeLinkFile;
  fs
    .readdirSync(from)
    .forEach((file) => {
      if( fileType ) return;

      fileType = getType(file);
      nodeLinkFile = file;
    });
  
  if( !fileType ) {
    throw new Error('No node or link file found in directory');
  } else if( fileType === 'region' ) {
    throw new Error('Moving regions is not currently supported');
  }

  if( fileType === 'node' ) {
    moveNode(rootDir, from, to, callback);
  } else {
    moveLink(rootDir, from, to, callback);
  }
}