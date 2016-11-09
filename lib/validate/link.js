var fs = require('fs');
var path = require('path');
var validateRefs = require('./refs');

module.exports = function(dir, hobbesFile, results, callback) {
  var json = fs.readFileSync(hobbesFile, 'utf-8');

  try {
    json = JSON.parse(json);
  } catch(e) {
    results.addError('PARSE_ERROR', hobbesFile, 'Node file is not valid JSON');
  }

  verifySymLink(dir, 'origin', results);
  verifySymLink(dir, 'terminus', results);

  validateRefs(dir, hobbesFile, json, results, true, callback);
}

function verifySymLink(dir, direction, results) {
  var symLink = path.join(dir, direction);

  // make sure there is a symbol link file
  if( !fs.existsSync(symLink) ) {
    results.addError('LINK_ERROR', symLink, `Link has no defined symbolic link for the ${direction}`);
    return;
  } 
  
  // make sure the file is actually a symbolic link
  var symLinkStat = fs.lstatSync(symLink);
  if( !symLinkStat.isSymbolicLink() ) {
    results.addError('LINK_ERROR', symLink, `Link ${direction} is not a symbolic link`);
    return;
  }

  // make sure the link points at a folder that actually exists
  var linkPath = path.join(dir, fs.readlinkSync(symLink));
  if( !fs.existsSync(linkPath) ) {
    results.addError('LINK_ERROR', symLink, `Link ${direction} points to location that does not exist: ${linkPath}`);
    return;
  }

  // make sure the symbolic link points at a directory
  var linkPathStat = fs.lstatSync(linkPath);
  if( !linkPathStat.isDirectory() ) {
    results.addError('LINK_ERROR', symLink, `Link ${direction} points to location that is not a directory: ${linkPath}`);
    return;
  }

  // verify the symlink directory has a node.json/node.geojson file
  var nodeFile;
  fs
    .readdirSync(linkPath)
    .forEach((file) => {
      if( nodeFile ) return;

      file = path.parse(file).base;
      if( file.match(/^node\.(json|geojson)$/i) ) {
        nodeFile = file;
      }
    });

  if( !nodeFile ) {
    results.addError('LINK_ERROR', symLink, `Link ${direction} points to directory that does not contain a node file: ${linkPath}`);
  }
}