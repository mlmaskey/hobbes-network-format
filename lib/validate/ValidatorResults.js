module.exports = function ValidatorResults() {
  this.errors = [];

  this.nodes = 0;
  this.links = 0;
  this.regions = 0;

  this.addError = function(type, file, message) {
    this.errors.push({
      type : type,
      file : file,
      message : message
    });
  }
}