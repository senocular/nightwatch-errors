function ErrorTest (context, name, timing, error, count) {
  this.context = context;
  this.name = name;
  this.timing = timing || 'sync';
  this.error = error || 'throw';
  this.count = count || 1;
}

module.exports = ErrorTest;
