var dir = '/Users/jrmerz/dev/watershed/calvin-network-data-v2/data';

require('./index.js')(dir, 'sacramento-river/northeast-valley/d75','san-francisco-bay/d75', () => {
  console.log('done');
});