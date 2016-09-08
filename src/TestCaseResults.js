var _ = require('lodash');
var clc = require('cli-color');
var log = require('./logger.js')(clc.bgYellow.black.bold);
var fail = clc.red;
var pass = clc.green;
var warn = clc.yellow;

function TestCaseResults (desc) {
  this.history = [];

  this.results = {};
  this.errorTest = null;
  this._childProcesses = [];
  this.exitCode = null;
  this.exitSignal = '';

  this.name = desc && desc.name || '<unnamed>';
  this.expected = desc && desc.expected || {};

  this.passes = true;
}

TestCaseResults.prototype.update = function (data) {
  this.history = data.history;

  var currTest = data.currentTest;
  if (currTest && currTest.module) {
    this.results[currTest.module] = currTest;
  }

  if (!this.errorTest && data.errorTest.test) { // not supporting multiple (array of) tests
    this.errorTest = data.errorTest;
  }
};

TestCaseResults.prototype.setExit = function (exitCode, signal, remainingChildProcesses) {
  this.exitCode = exitCode;
  this.exitSignal = signal;
  this._childProcesses = remainingChildProcesses || [];
};

TestCaseResults.prototype.report = function () {
  var test = this.errorTest && this.errorTest.test;
  log('TEST CASE: ' + this.name +
    ' | testing: ' + (test ? JSON.stringify(test) : '<none>') +
    ' | exit code: ' + this.exitCode +
    (this.exitSignal ? ' (' + this.exitSignal + ')' : ''));

  if (this._childProcesses.length) {
    this.logFailResult('Remaining child processes (killed):',
      this._childProcesses.map(function (proc) {
        return proc.COMM;
      }));
  }

  this._assertBeforeAfterMatches();
  this._compareExpected();
};

TestCaseResults.prototype._assertBeforeAfterMatches = function () {

  // let expected handle history validation if it exsists; there may
  // be an expectation that hooks shouldn't exist or match
  if (this.expected.history) {
    return;
  }

  var history = this.history;
  var historyCounts = _.countBy(history);

  var hookMatches = [
    ['global.before','global.after'],
    ['global.beforeEach','global.afterEach'],
    ['suite.before','suite.after'],
    ['suite.beforeEach','suite.afterEach']
  ];

  hookMatches.forEach(function checkForMismatches (match) {
    var before = match[0];
    var befores = historyCounts[before] || 0;
    var after = match[1];
    var afters = historyCounts[after] || 0;

    if (befores !== afters) {
      this.logFailResult('Hooks count mismatch: ' +
        before + ' = ' + befores + ' when ' +
        after + ' = ' + afters + '.');
    }
  }.bind(this));

  var missing = _.flatten(hookMatches).filter(function (hookName) {
    return !_.includes(history, hookName);
  });

  if (missing.length) {
    this.logWarnResult('Hooks missing: ' + missing.join(', ') + '.');
  }

  // Not checking number of occurrences if more are expected (skipped vs. not test cases)
};

TestCaseResults.prototype._compareExpected = function () {

  if (this.expected.history) {
    if (!_.isEqual(this.history, this.expected.history)) {
      this.logFailResult('History mismatch. Got:\n' + this.history + '\nExpected:\n' + this.expected.history);
    } else {
      this.logPassResult('History match PASS');
    }
  }

  if (this.expected.results) {
    if (!_.isMatch(this.results, this.expected.results)) {
      this.logFailResult('Results mismatch. Got:\n' + JSON.stringify(this.results) +
        '\nExpected:\n' + JSON.stringify(this.expected.results));
    } else {
      this.logPassResult('Results match PASS');
    }
  }

  if ('exitCode' in this.expected) {
    if (this.exitCode !== this.expected.exitCode) {
      this.logFailResult('Exit code mismatch. Got: ' + this.exitCode + ', Expected: ' + this.expected.exitCode);
    } else {
      this.logPassResult('Exit code match PASS');
    }
  }
};

TestCaseResults.prototype.logFailResult = function () {
  this._log(fail, arguments);
  this.passes = false;
};
TestCaseResults.prototype.logPassResult = function () {
  this._log(pass, arguments);
};
TestCaseResults.prototype.logWarnResult = function () {
  this._log(warn, arguments);
};
TestCaseResults.prototype._log = function (formatter, args) {
  args = Array.prototype.slice.call(args);
  args[0] = 'RESULT: ' + formatter(args[0]);
  log.apply(null, args);
};

module.exports = TestCaseResults;