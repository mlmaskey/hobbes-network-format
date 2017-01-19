var program = require('commander');
var path = require('path');
var fs = require('fs');

program
  .version(require('../package').version)
  .usage('[/path/to/hobbes/data]')
  .description('Export as GeoJSON')
  .parse(process.argv);

if( program.args.length === 0 ) {
   program.outputHelp();
   return;
}

var dir = program.args[0];
if( !path.isAbsolute(dir) ) {
  dir = path.join(process.cwd(), dir);
}

if( !fs.existsSync(dir) ) {
  return console.log(colors.red(`Invalid directory: ${dir}`));
}

require('../lib/export')(dir, () => {
  console.log('Complete');
});