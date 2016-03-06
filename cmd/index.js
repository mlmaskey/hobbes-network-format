var program = require('commander');
var crawler = require('../lib/crawler');
var validate = require('../lib/validate');
var colors = require('colors');

program
  .version('0.0.1')
  .option('-p, --parse-data', 'Parse data files (csv, json, etc)')
  .option('-r, --reindex', 'Walk data directory and generate root network.json & regions.json files before running')
  .option('-v, --verbose', 'Verbose')
  .option('-e, --verify', 'Verify geojson')
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

crawler(program.directory, options, function(resp, options){
  onCrawlComplete(resp, options);
});

function onCrawlComplete(crawlerResponse, options) {
  var id = options.walkerConfig.id || 'id';
  var rid = options.walkerConfig.regionId || 'id';

  if( program.verify ) {
    var errors = validate(crawlerResponse.nodes.features, {id: id});
    var rerrors = validate(crawlerResponse.regions.features, {id: rid});

    if( errors > 0 ) {
      console.log(colors.red('\nYour directory has '+errors+' node/link errors'));
    } else {
      console.log(colors.green('\nYour nodes and links are valid ('+crawlerResponse.nodes.features.length+')'));
    }

    if( rerrors > 0 ) {
      console.log(colors.red('Your directory has '+rerrors+' region errors\n'));
    } else {
      console.log(colors.green('Your regions are valid ('+crawlerResponse.regions.features.length+') \n'));
    }
  } else {

    console.log('\n**** Nodes and Links ('+crawlerResponse.nodes.features.length+') ****');
    crawlerResponse.nodes.features.forEach(function(node){
     console.log(node.properties[id]);
    });

    console.log('\n**** Regions ('+crawlerResponse.regions.features.length+') ****');
    crawlerResponse.regions.features.forEach(function(node){
     console.log(node.properties[rid]);
    });
  }
}
