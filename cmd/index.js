var program = require('commander');
var crawler = require('../lib/crawler');

program
  .version('0.0.1')
  .option('-p, --parse-data', 'Parse data files (csv, json, etc)')
  .option('-r, --reindex', 'Walk data directory and generate root network.json & regions.json files before running')
  .option('-v, --verbose', 'Verbose')
  .option('-d, --directory [directory]', 'Root data directory to crawl')
  .parse(process.argv);

if( !program.directory ) {
  program.outputHelp();
  return;
}

var options = {
  parseCsvData: program.parseData || false,
  debug: program.verbose || false,
  reindex : program.reindex || false
};


crawler(program.directory, options, function(resp){
  resp.nodes.features.forEach(function(node){
   console.log(node.properties);
  //  console.log();
  });
});
