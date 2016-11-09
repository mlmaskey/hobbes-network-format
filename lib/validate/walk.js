var fs = require('fs');
var path = require('path');
var async = require('async');

var validateLink = require('./link');
var validateNode = require('./node');
var validateRegion = require('./region');

function walk(dir, results, callback) {
  // make sure we actually have a folder
  var stat = fs.lstatSync(dir);
  if( !stat.isDirectory() ) {
    results.addError('DIRECTORY_ERROR', dir, 'Not a directory');
    return callback();
  }

  var info = bookkeeping(dir, results);
  if( info.hasError ) {
    return callback();
  }

  switch(info.is) {
    case 'node':
      validateNode(dir, info.hobbesFile, results, callback);
      break;

    case 'link':
      validateLink(dir, info.hobbesFile, results, callback);
      break;

    case 'region':
      validateRegion(dir, info.hobbesFile, results, () => {
        iterateFolders(info.folders, results, callback);
      });
      break;

    default:
      iterateFolders(info.folders, results, callback);
  }
}

function iterateFolders(folders, results, callback) {
  async.eachSeries(folders,
    (folder, next) => {
      walk(folder, results, next);
    },
    (err) => {
      callback();
    }
  );
}

function bookkeeping(dir, results) {
  // list file contents
  var fileList = fs.readdirSync(dir);

  // bookkeeping information
  var folders = [];
  var files = [];
  var symLinks = [];
  var hasError = false;
  var hobbesFile = '';
  var is = '';

  // inspect all files for this directory, fill in bookkeeping
  var file, type;
  for( var i = 0; i < fileList.length; i++ ) {
    file = path.join(dir, fileList[i]);
  	stat = fs.lstatSync(file);

    if( stat.isSymbolicLink() ) {
      symLinks.push(file);
    } if( stat.isDirectory() ) {
      folders.push(file);
    } else {
      files.push(file);

      // check type information and that we have only one node, link or region file
      type = getType(file);
      if( type ) {
        if( is === '' ) {
          hobbesFile = file;
          is = type;
        } else {
          hasError = true;
          results.addError('DIRECTORY_ERROR', dir, `Multiple node, link and/or region files found.  ${type} file found, but ${is} already exists in folder`);
        }
      }

    }
  }

  return {
    folders : folders,
    files : files,
    hobbesFile : hobbesFile,
    symLinks : symLinks,
    hasError : hasError,
    is : is
  }

}

function getType(file) {
  file = path.parse(file).base;

  if( file.match(/^node\.(geojson|json)$/i) ) {
    return 'node';
  }

  if( file.match(/^link\.(geojson|json)$/i) ) {
    return 'link';
  }

  if( file.match(/^region\.(geojson|json)$/i) ) {
    return 'region';
  }

  return null;
}

module.exports = walk;