function ErrorTest (context, name, timing, error) {
  this.context = context;
  this.name = name;
  this.timing = timing || 'sync';
  this.error = error || 'throw';
}

ErrorTest.prototype.targetsAsyncHook = function() {
  return this.context === 'suite' && this.timing !== 'sync'; // all others async
};

module.exports = ErrorTest;
