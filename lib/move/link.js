var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');

module.exports = function(rootDir, from, to, linkFile, callback) {
  var origin = path.join(from, 'origin');
  var terminus = path.join(from, 'terminus');

  if( !fs.existsSync(origin) ) {
    throw new Error('Link origin file does not exist');
  } else if( !fs.existsSync(terminus) ) {
    throw new Error('Link terminus file does not exist');
  }

  origin = fs.readlinkSync(origin);
  terminus = fs.readlinkSync(terminus);

  
  fs.move(from, to, (err) => {
    if (err) throw(err);

    var newOriginFile = path.join(to, 'origin');
    var newTerminusFile = path.join(to, 'terminus');

    fs.unlinkSync(newOriginFile);
    fs.unlinkSync(newTerminusFile);

    var originPath = path.relative(newOriginFile, origin);
    var terminusPath = path.relative(newTerminusFile, terminus);

    fs.symlinkSync(newOriginFile, originPath);
    fs.symlinkSync(newTerminusFile, terminusPath);

    callback();
  });
}