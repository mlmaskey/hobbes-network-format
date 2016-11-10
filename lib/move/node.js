var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var fastWalk = require('../crawler/fast-walk');

module.exports = function(rootDir, from, to, nodeFile, callback) {
  var files = fastWalk(rootDir, true);
  
  // trim down to origins and terminus symbolic links
  for( var i = files.length-1; i >= 0; i-- ) {
    if( !files[i].file.match(/origin/) && !files[i].file.match(/terminus/) ) {
      files.splice(i, 1);
      continue;
    }

    var src = fs.readlinkSync(path.join(files[i].path, files[i].file));
    if( !path.isAbsolute(src) ) {
      src = path.join(files[i].path, src);
    }

    if( src !== from ) {
      files.splice(i, 1);
    }
  }

  fs.move(from, to, (err) => {
    files.forEach((file) => {
      var fullpath = path.join(file.path, file.file);
      fs.unlinkSync(fullpath);
      fs.symlinkSync(fullpath, to);
    });

    callback();
  });
}