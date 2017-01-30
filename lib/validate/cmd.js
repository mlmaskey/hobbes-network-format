var fs = require('fs');
var validate = require('./');
var csvWriter = require('csv-write-stream');
var colors = require('colors');

module.exports = function(dir, argv, callback) {
  console.log('\n=======================================');
  console.log(require('../../bin/logo'));
  console.log('\n========= Network Validator ===========');

  if( !fs.existsSync(dir) ) {
    return console.log(colors.red(`Invalid directory: ${dir}`));
  }

  process.stdout.write('Processing network');

  var i = 0;
  var timer = setInterval(function() {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    i = (i + 1) % 4;
    var dots = new Array(i + 1).join('.');
    process.stdout.write('Processing network' + dots);
  }, 500);


  validate(dir, (results) => {
    clearInterval(timer);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    console.log(`
  Found:
    Nodes   : ${results.nodes}
    Links   : ${results.links}
    Regions : ${results.regions}

    `);

    if( results.errors.length === 0 ) {
      console.log('No Errors Found!\n');
      return;
    } else {
      console.log(colors.red(`${results.errors.length} Errors Found:`));
    }

    var writer;
    if( argv.dump ) {
      var exportFile;
      if( argv.dump === true ) {
        exportFile = 'errors.csv';
      } else {
        exportFile = argv.dump;
      }
      
      if( path.parse(exportFile).ext === '' ) {
        exportFile = exportFile+'.csv';
      }
      writer = csvWriter()
      writer.pipe(fs.createWriteStream(exportFile))
    }

    results.errors.forEach((err) => {
      console.log(colors.red(`${err.type} | ${err.message} | ${err.file}`));
      if( writer ) writer.write(err);
    });
    if( writer ) writer.end();
    console.log('');

    if( callback ) callback();
  });
}