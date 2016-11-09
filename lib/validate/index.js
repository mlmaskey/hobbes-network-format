var ValidatorResults = require('./ValidatorResults');
var walk = require('./walk');

module.exports = function(dir) {
  var results = new ValidatorResults();
  walk(dir, results, () => {
    onComplete(results);
  });
};


function onComplete(results) {
  results.errors.forEach((err) => {
    console.log(err);
  });

  console.log('done');
}