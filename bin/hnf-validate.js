var program = require('commander');
var path = require('path');
var fs = require('fs');
var validate = require('../lib/validate');
var csvWriter = require('csv-write-stream');
var colors = require('colors');

program
  .version(require('../package').version)
  .usage('[options] [/path/to/hobbes/data]')
  .description('Validate a HOBBES network')
  .option('-d, --dump [file]', 'Dump errors to csv file')
  .parse(process.argv);

if( program.args.length === 0 ) {
   program.outputHelp();
   return;
}

var dir = program.args[0];
if( !path.isAbsolute(dir) ) {
  dir = path.join(process.cwd(), dir);
}

console.log('\n=======================================');
console.log(require('./logo'));
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
  if( program.dump ) {
    var exportFile;
    if( program.dump === true ) {
      exportFile = 'errors.csv';
    } else {
      exportFile = program.dump;
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

});