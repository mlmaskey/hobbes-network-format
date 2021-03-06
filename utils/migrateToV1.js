var walk = require('../lib/crawler/fast-walk');
var path = require('path');
var fs = require('fs');
var dir = process.argv[2];

var dirs = walk(dir);
var nodesByPrm = {};
var links = [];

dirs.forEach((f) => {
  if( f.file.match(/link.(geojson|json)/i) ) {
    links.push(f);
  } else if ( f.file.match(/node.(geojson|json)/i) ) {
    var data = JSON.parse(fs.readFileSync(path.join(f.path, f.file), 'utf-8').replace(/\r|\n/g,''));
    nodesByPrm[data.properties.prmname] = f.path;
  }
});

function processLink(link) {
  var data = JSON.parse(fs.readFileSync(path.join(link.path, link.file), 'utf-8').replace(/\r|\n/g,''));

  var origin = path.relative(link.path, nodesByPrm[data.origin ? data.origin : data.properties.origin]);
  var terminus = path.relative(link.path, nodesByPrm[data.terminus ? data.terminus : data.properties.terminus]);

  fs.symlinkSync(origin, path.join(link.path,'origin'));
  fs.symlinkSync(terminus, path.join(link.path,'terminus'));

  fs.unlinkSync(path.join(link.path, link.file));
  fs.writeFileSync(path.join(link.path, link.file), JSON.stringify(data.properties ? data.properties : data, '  ', '  '));

  console.log(data.properties ? data.properties.prmname : data.prmname);
  console.log(`  ${origin} -> ${terminus}`);
}

links.forEach(processLink);