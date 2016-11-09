module.exports = function ValidatorResults() {
  this.errors = [];

  this.types = {
    'DIRECTORY_ERROR' : 'DIRECTORY_ERROR',
    'FILE_ERROR' : 'FILE_ERROR',
    'PARSE_ERROR' : 'PARSE_ERROR'
  }

  this.addError = function(type, file, message) {
    this.errors.push({
      type : type,
      file : file,
      message : message
    });
  }
}