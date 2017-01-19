var program = require('commander');

program
  .version('0.0.1')
  .command('validate', 'Validate a HOBBES network')
  .command('export', 'Export as GeoJSON')
  .parse(process.argv);