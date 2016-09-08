var _ = require('lodash');
var clc = require('cli-color');
var log = require('./logger.js')(clc.bgYellow.black.bold);
var fail = clc.red;
var pass = clc.green;

var TestCase = require('./TestCase.js');

function TestRunner () {
  this._testCases = null; // array of tests to run
  this._results = null; // array of results

  _.bindAll(this, ['_onTestCaseComplete']);
}

TestRunner.prototype.run = function (testCases) {
  if (this._testCases) {
    throw new Error('Run already in progress');
  }

  this._testCases = this._parseTestCases(testCases);
  this._results = [];
  log('STARTING:', this._testCases.length + ' test case(s)');
  this._runNextTestCase();
};

TestRunner.prototype._parseTestCases = function (testCases) {

  if (!Array.isArray(testCases)) {
    testCases = [testCases];
  }

  var only = testCases.only;
  if (only) {

    if (!Array.isArray(only)) {
      only = [only];
    }
    testCases = testCases.filter(function (testCase) {
      return only.indexOf(testCase.name) >= 0;
    });
  }

  testCases = testCases.filter(function (testCase) {
    return !testCase.disabled;
  });

  testCases = testCases.map(function(testCase) {
    return testCase instanceof TestCase ? testCase : new TestCase(testCase);
  });

  return testCases;
};

TestRunner.prototype._runNextTestCase = function () {
  var testCase = this._testCases.shift();
  testCase.run(this._onTestCaseComplete);
};

TestRunner.prototype._onTestCaseComplete = function (testCase) {

  var currResults = testCase.getResults();
  this._results.push(currResults);
  currResults.report();

  if (!this._testCases.length) {
    this._testCases = null;
    log('ALL TEST CASES COMPLETE!');
    this._reportResults();
    return;
  }

  this._runNextTestCase();
};

TestRunner.prototype._reportResults = function () {
  var failures = this._results.reduce(function(count, result) {
    return count + Number(!result.passes);
  }, 0);

  if (failures) {
    log('ALL RESULTS: ' + fail(failures + ' failure(s).'));
  } else {
    log('ALL RESULTS: ' + pass('All tests pass!'));
  }
};

module.exports = TestRunner;
