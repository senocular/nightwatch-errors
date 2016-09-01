var ErrorTest = require('./ErrorTest.js');

var testCases = [
  {
    disabled: true,
    name: 'sanity'
  },
  {
    disabled: true,
    name: 'global.beforeEach',
    test: new ErrorTest('global', 'beforeEach', 'sync-done', 'throw')
  },
  {
    name: 'global.afterEach',
    test: new ErrorTest('global', 'afterEach', 'sync', 'throw')
  },
  // Times out; browser and java process left hanging.
  // Need to be able to run by itself to verify behavior when not run in runner.
  // {
  //   name: 'testcase:timeout',
  //   test: new ErrorTest('suite1', 'testcase1', 'timeout')
  // }
];

//testCases.only = 'sanity';
module.exports = testCases;