'use strict';

/*
 # split -
 Given a path, a set of options, and a set of ids returns three geometry sets of
 node/links; in,out, and edge.
 in - All links and nodes in the network
 out - All Links and Nodes outside the network
 edge - All Links and Nodes on the edge of the network.
 options:
 linked : [boolean] } : Default is true.
 expand : {inflows:1} : Standard expansion option
## OPTIONS
### Linked
If linked is true, here are the rules.
- Any link where both the origin and terminal nodes are *in* is *in*.
- Any link where one of origin / terminal are in is *edge*.
- Any link where neither origin / terminal are in is *out*.
- Any node with a link *in* and a link *out* is *edge*
- Any node with all links *in* is *in*
*/

var crawler = require('./crawler');

module.exports = function(path, opts, item_list, callback) {
    var linked = opts.linked || true;

    // set id you want to split on
    var getId = opts.getId;
    if( !getId ) {
      getId = function(properties) {
        return properties.hobbes.id;
      }
    }

    var ins = [];
    var outs = [];
    var edges = [];

    var items = {};
    var all;

    // This could also check for features and use id if that's what they are
    item_list.forEach(function(i) {
      items[i] = true;
    });

    crawler(path, opts, function(results){
      onCrawlComplete(items, results, getId, callback);
    });
};

function onCrawlComplete(items, result, getId, callback) {
  var additional = [];

  var all = result.nodes.features;

  var lookup = {};
  var ins = {};
  var outs = {};

  var edgeIn = {};
  var edgeOut = {};
  var nodeIn = {};
  var nodeOut = {};

  all.forEach(function(n){
    var p = n.properties;
    var id = getId(p);
    lookup[id] = n;

    if( p.hobbes.type === 'link' ) { // Link
      if( items[id] ) {              // Explicitly *in*
        ins[id] = n;
      }
    } else {             // Node
      if( items[id] ) {  // Explicitly *in*
        ins[id] = n;
      }
    }
  });

  all.forEach(function(n) {
    var p = n.properties;
    var id = p.hobbes.id;

    if( p.hobbes.type === 'link' ) {
      if( ins[id] ) { // if link is in and origin/terminus is not, set nodes as edge
        if( lookup[p.terminus] && !ins[p.terminus] ) {
          nodeOut[p.terminus] = lookup[p.terminus];
        }
        if( lookup[p.origin] && !ins[p.origin] ) {
          nodeIn[p.origin] = lookup[p.origin];
        }
        return;
      }

      if( ins[p.origin] && ins[p.terminus] ) { // both nodes are in
        ins[id] = n;
      } else if( ins[p.terminus] ) { // terminus is in, origin is out
        edgeIn[id] = n;
        nodeIn[p.origin] = lookup[p.origin];
      } else if( ins[p.origin] ) { // origin is in, terminus is out
        edgeOut[id] = n;
        nodeOut[p.terminus] = lookup[p.terminus];
      }
    }
  });

  all.forEach(function(n) {
    var id = n.properties.hobbes.id;
    if( !ins[id] && !edgeIn[id] && !edgeOut[id] && !nodeIn[id] && !nodeOut[id] ) {
      outs[id] = n;
    }
  });

  ins = values(ins);
  outs = values(outs);
  edgeIn = values(edgeIn);
  edgeOut = values(edgeOut);
  nodeIn = values(nodeIn);
  nodeOut = values(nodeOut);

  var edgesIn = [];
  nodeIn.forEach(function(n){
    edgesIn.push(n);
  });
  edgeIn.forEach(function(n){
    edgesIn.push(n);
  });

  var edgesOut = [];
  nodeOut.forEach(function(n){
    edgesOut.push(n);
  });
  edgeOut.forEach(function(n){
    edgesOut.push(n);
  });

  // Okay return our sets
  callback({
    in : ins,
    edge : {
      in : edgesIn,
      out : edgesOut,
    },
    out : outs
  });
}

function values(obj) {
  var tmp = [], key;
  for( key in obj ) tmp.push(obj[key]);
  return tmp;
}