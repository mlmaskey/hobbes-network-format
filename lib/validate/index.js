var ValidatorResults = require('./ValidatorResults');
var walk = require('./walk');

module.exports = function(dir, callback) {
  var results = new ValidatorResults();
  walk(dir, results, () => {
    callback(results);
  });
};