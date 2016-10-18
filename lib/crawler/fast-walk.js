var fs = require('fs');
var path = require('path');

var files = [];

function read(currentPath, file) {
  folder = path.join(currentPath, file);
  
  var fileList = fs.readdirSync(folder);
  var t = '', stat, folder;

  for( var i = 0; i < fileList.length; i++ ) {
    t = path.join(folder, fileList[i]);
  	stat = fs.lstatSync(t);

    if( stat.isSymbolicLink() ) {
      continue;
    } if( stat.isDirectory() ) {
      read(folder, fileList[i]);
    } else {
      files.push({
        file : fileList[i],
        path : folder
      });
    }
  }
}

module.exports = function(startPath) {
  files = [];
  read('', startPath);
  return files;
}