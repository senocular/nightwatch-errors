function ErrorTest (context, name, timing, error) {

  // see errorTesting.js for more info

  this.context = context; // 'global' or 'suite' for hooks; the suite/module name if targeting test cases (not hooks)
  this.name = name; // 'before', 'beforeEach', 'afterEach', 'after' or the test case name if targeting test cases (not hooks)
  this.timing = timing || 'sync'; // 'timeout', 'sync', 'sync-done', 'async'
  this.error = error || 'throw'; // 'throw', 'assert', 'verify', 'expect', 'done'
}

ErrorTest.targetsAsyncHook = function(errorTest) {
  return errorTest.context === 'suite' && errorTest.timing !== 'sync'; // all others async
};

module.exports = ErrorTest;
