var expand = require('../expand');
var async = require('async');


module.exports = function(networkFiles, opts, callback) {
  expandArray(networkFiles.data.link, networkFiles.dir, opts, () => {
    expandArray(networkFiles.data.node, networkFiles.dir, opts, () => {
      callback();
    });
  });
}

function expandArray(data, repoDir, opts, callback) {
  async.eachSeries(
    data,
    (item, next) => {
      expand({
        node : item.data,
        repoDir : repoDir,
        onlyParse : opts.onlyParse
      }, () => {
        next();
      });

    },
    (err) => {
      callback();
    }
  )
}