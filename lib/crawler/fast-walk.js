var fs = require('fs');
var path = require('path');

function read(currentPath, file, files, includeSymLinks) {
  folder = path.join(currentPath, file);
  
  var fileList = fs.readdirSync(folder);
  var t = '', stat, folder;

  for( var i = 0; i < fileList.length; i++ ) {
    t = path.join(folder, fileList[i]);
  	stat = fs.lstatSync(t);

    if( stat.isSymbolicLink() ) {
      if( includeSymLinks ) {
        files.push({
          file : fileList[i],
          path : folder
        });
      }
      continue;
    } if( stat.isDirectory() ) {
      read(folder, fileList[i], files, includeSymLinks);
    } else {
      files.push({
        file : fileList[i],
        path : folder
      });
    }
  }
}

module.exports = function(startPath, includeSymLinks) {
  var files = [];
  read('', startPath, files, includeSymLinks);
  return files;
}