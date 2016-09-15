var _ = require('lodash');
var clc = require('cli-color');
var log = require('./logger.js')(clc.bgYellow.black.bold);
var fail = clc.red;
var pass = clc.green;
var skip = clc.cyan;

var TestCase = require('./TestCase.js');

function TestRunner () {
  this._testCases = null; // array of tests to run
  this._results = null;   // array of results
  this.skipped = 0;       // tests not run

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

  var origCount = testCases.length;

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

  this.skipped = origCount - testCases.length;

  return testCases;
};

TestRunner.prototype._runNextTestCase = function () {
  var testCase = this._testCases.shift();
  testCase.getResults().reportStarted();
  testCase.run(this._onTestCaseComplete);
};

TestRunner.prototype._onTestCaseComplete = function (testCase) {

  var results = testCase.getResults();
  results.collect();
  results.reportCompleted();
  this._results.push(results);

  if (!this._testCases.length) {
    this._testCases = null;
    this._reportAllCompleted();
    return;
  }

  this._runNextTestCase();
};

TestRunner.prototype._reportAllCompleted = function () {

  function bar () {
    console.log(' ');
    log(clc.bgYellow.black.bold(new Array(81).join('━')));
    console.log(' ');
  }

  bar();
  log('ALL TEST CASES COMPLETE!');
  bar();

  this._reportResults();
};

TestRunner.prototype._reportResults = function () {
  var failures  = 0;
  var passes = 0;
  var oks = 0;

  this._results.forEach(function(result) {
    switch (result.passes) {
      case false: failures++; break;
      case true: passes++; break;
      case undefined:
      case null: oks++; break;
    }
  });

  var summary = 'ALL RESULTS (' + this._results.length + ' total): ';
  var stats = [];
  if (failures) {
    stats.push(fail(failures + ' failed'));
  }
  if (passes) {
    stats.push(pass(passes + ' passed'));
  }
  if (oks) {
    stats.push(pass(oks + ' ok'));
  }
  if (this.skipped) {
    stats.push(skip(this.skipped + ' skipped'));
  }

  summary += stats.join(', ') + '\n';

  log(summary);

  this._results.forEach(function (result) {
    result.reportCapture();
  });

  log(summary);
};

module.exports = TestRunner;
