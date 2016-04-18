var assert = require('assert');

describe('hnf.split', function() {

  var hnf, data;

  function toIds(i) {
    return i.properties.prmname;
  }

  before(function() {
    hnf = require('../../index.js');
    data = require('./data');
    config = require('../config');
  });

  it('should return split out network', function(next) {
    this.timeout(10000);

    hnf.split(config.path, {}, data.nodes, function(resp){

      assert.deepEqual([ 'SR_WHI','D5','SR_WHI-D5' ], resp.in.map(toIds));
      assert.deepEqual([ 'SR_SHA', 'D94' ], resp.edge.in.nodes.map(toIds));
      assert.deepEqual([ 'SR_SHA-D5', 'D94-SR_WHI' ], resp.edge.in.links.map(toIds));
      assert.deepEqual([ 'HSU101SR3', 'D73', 'WTP101', 'HSU101D5' ], resp.edge.out.nodes.map(toIds));
      assert.deepEqual([ 'SR_WHI-HSU101SR3', 'SR_WHI-D73', 'D5-WTP101', 'D5-HSU101D5', 'D5-D73' ], resp.edge.out.links.map(toIds));

      next();
    });
  });

});
