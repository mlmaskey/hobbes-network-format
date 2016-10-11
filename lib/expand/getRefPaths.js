'use strict';

module.exports = function(obj) {
  var list = [], path = [];

  walk(obj, list, path);

  return list;
}

function walk(obj, list, path) {
  var nested, key, i;

  if( Array.isArray(obj) ) {
    for( i = 0; i < obj.length; i++ ) {
      if( typeof obj[i] === 'object' ) {
        nested = path.slice(0);
        nested.push(i+'');
        walk(obj[i], list, nested);
      }
    }
  } else {
    for( key in obj ) {   
      if( key === '$ref' ) {
        var tmp = path.slice(0);
        tmp.push('$ref');
        list.push(tmp.join('.'));
      } else if( typeof obj[key] === 'object' ) {
        nested = path.slice(0);
        nested.push(key);
        walk(obj[key], list, nested);
      }
    }
  }
}