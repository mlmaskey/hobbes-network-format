var expand = require('../expand');
var async = require('async');


module.exports = function(networkFiles, callback) {
  expandArray(networkFiles.data.link, networkFiles.dir, () => {
    expandArray(networkFiles.data.node, networkFiles.dir, () => {
      callback();
    });
  });
}

function expandArray(data, repoDir, callback) {
  async.eachSeries(
    data,
    (item, next) => {
      expand({
        node : item.data,
        repoDir : repoDir
      }, next);
    },
    (err) => {
      callback();
    }
  )
}