var ErrorTest = require('./ErrorTest.js');

module.exports = [
  {
    name: 'global.beforeEach',
    test: new ErrorTest('global', 'beforeEach', 'sync', 'throw')
  },
  // Times out; browser and java process left hanging.
  // Need to be able to run by itself to verify behavior when not run in runner.
  // {
  //   name: 'testcase:timeout',
  //   test: new ErrorTest('suite1', 'testcase1', 'timeout')
  // }
];
