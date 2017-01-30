var program = require('commander');
var path = require('path');


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

require('../lib/validate/cmd')(dir, program);