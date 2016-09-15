var _ = require('lodash');
var clc = require('cli-color');
var log = require('./logger.js')(clc.bgYellow.black.bold);
var fail = clc.red;
var pass = clc.green;
var block = clc.black.bgWhite;
var blockPass = clc.black.bgGreen;
var blockFail = clc.black.bgRed;

var ErrorTest = require('./ErrorTest.js');

function TestCaseResults (desc) {
  this.history = [];

  this.nwResults = {};
  this.errorTest = null;
  this._childProcesses = [];
  this.exitCode = null;
  this.exitSignal = '';

  this.name = desc && desc.name || '';
  this.expected = desc && desc.expected || {};

  this._results = [];
  this.resultExit = this._addResult('[Exit]');
  this.resultChildProc = this._addResult('[Procs]', true);
  this.resultHooks = this._addResult('[Hooks]', true);
  this.resultHistory = this._addResult('[History]');
  this.resultResults = this._addResult('[Results]');

  this.passes = null; // null = OK (not failing but not everything checked for pass), true = Pass, false = Fail
}

TestCaseResults.prototype._addResult = function (tag, passes, summary) {
  var result = new Result(tag, passes, summary);
  this._results.push(result);
  return result;
};

TestCaseResults.prototype.update = function (data) {
  this.history = data.history;

  var currTest = data.currentTest;
  if (currTest && currTest.module) {
    this.nwResults[currTest.module] = currTest;
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

TestCaseResults.prototype.collect = function () {
  var numProcs = this._childProcesses.length;
  if (numProcs) {
    var procs = this._childProcesses.map(function (proc) {
      var comm = String(proc.COMM);
      var slashIndex = comm.lastIndexOf('/') + 1;
      return comm.slice(slashIndex);
    });

    this.resultChildProc.update(false, null,
      numProcs + ' orphaned child processes (killed): ' +
      procs.join(', '));
  }
  
  if (this.exitCode === null) {
    this.resultExit.update(false, null, 'Nightwatch did not exit (timeout)');
  }

  this._assertBeforeAfterMatches();
  this._compareExpected();
  this._updatePasses();
};

TestCaseResults.prototype.reportStarted = function () {
  log(block(' RUNNING: ' + this.name + '... '));
};

TestCaseResults.prototype.reportCompleted = function () {
  var test = this.errorTest && this.errorTest.test;
  log(
    block(' COMPLETED:', this.name +
      ' ' + ErrorTest.toString(test) +
      ' | exit code: ' + this.exitCode +
      (this.exitSignal ? ' (' + this.exitSignal + ') ' : ' ')
    ) +
    this._getPassFailText()
  );
};

TestCaseResults.prototype.reportCapture = function () {

  var test = this.errorTest && this.errorTest.test;
  log(
    block(' RESULTS:', this.name +
      ' ' + ErrorTest.toString(test) + ' '
    ) +
    this._getPassFailText()
  );

  if (this.passes === true) return;

  var messages = _.flatten(this._results.map(function (result) {
    return result.messages.map(function (message) {
      return result.tag + ' ' + message;
    });
  }));

  if (this.passes !== true) {
    messages.unshift(this._getSummaryText());
  }

  if (messages.length) {
    var last = messages.pop();
    messages.forEach(function (message) {
      log('┣ ' + message); // ┣┗┃━
    });
    log('┗ ' + last + '\n');
  }
};

TestCaseResults.prototype._getSummaryText = function () {
  var stats = this._results.map(function (result) {
    var summary = result.summary;
    if (!summary) {
      switch (result.passes) {
        case false: summary = fail('fail'); break;
        case true: summary = pass('pass'); break;
        case undefined:
        case null: summary = '-'; break;
      }
    }
    return result.tag + ' ' + summary;
  });

  return 'Summary: ' + stats.join(' | ');
};

TestCaseResults.prototype._getPassFailText = function () {
  switch (this.passes) {
    case true: return blockPass(' PASSED ');
    case false: return blockFail(' FAILED ');
  }
  return blockPass(' OK ');
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
      this.resultHooks.update(false, null, 'count mismatch: ' +
        before + ' = ' + befores + ' when ' +
        after + ' = ' + afters + '.');
    }
  }.bind(this));

  var missing = _.flatten(hookMatches).filter(function (hookName) {
    return !_.includes(history, hookName);
  });

  if (missing.length) {
    this.resultHooks.update(null, null, 'missing: ' + missing.join(', ') + '.');
  }

  // Not checking number of occurrences if more are expected (skipped vs. not test cases)
};

TestCaseResults.prototype._compareExpected = function () {

  if (this.expected.history) {
    if (!_.isEqual(this.history, this.expected.history)) {

      var diff = _uniqDiff(this.history, this.expected.history).map(function (item) {
        return '+' + item;
      }).concat(_uniqDiff(this.expected.history, this.history).map(function (item) {
        return '-' + item;
      }));

      diff = _.uniq(_.map(_.countBy(diff), function (count, item) {
        return (count > 1 ? item + '(x' + count + ')' : item);
      }));

      this.resultHistory.update(false, null,
        'mismatch.\nGot:\n' + this.history +
        '\nExpected:\n' + this.expected.history +
        '\nDiff:\n' + diff); // TODO: handle difference duplicates
    } else {
      this.resultHistory.update(true);
    }
  }

  if (this.expected.results) {
    if (!_.isMatch(this.nwResults, this.expected.results)) {
      this.resultResults.update(false, null,
        'mismatch.\nGot:\n' + JSON.stringify(this.nwResults) +
        '\nExpected:\n' + JSON.stringify(this.expected.results));
    } else {
      this.resultResults.update(true);
    }
  }

  if ('exitCode' in this.expected) {
    if (this.exitCode !== this.expected.exitCode) {
      this.resultExit.update(false, null, 'mismatch. Got: ' + this.exitCode + ', Expected: ' + this.expected.exitCode);
    } else {
      this.resultExit.update(true);
    }
  } else {
    this.resultExit.update(null, this.exitCode);
  }
};

TestCaseResults.prototype._updatePasses = function () {
  this.passes = this._results.reduce(function (passes, result) {
    if (passes === false || result.passes === false) return false;
    if (passes === null) return null;
    return result.passes;
  }.bind(this), true);
};

function Result(tag, passes, summary) {
  this.tag = tag;
  this.passes = passes === undefined ? null : passes;
  this.summary = summary;
  this.messages = [];
}

Result.prototype.update = function (passes, summary, messages) {
  var formatter = _.identity;

  if (passes === true || passes === false) {
    this.passes = passes;
    formatter = this.passes ? pass : fail;
  }

  if (summary !== null && summary !== undefined) {
    this.summary = formatter(summary);
  }

  if (messages) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }
    messages = messages.map(function (message) {
      return formatter(message);
    });
    this.messages = this.messages.concat(messages);
  }
};

function _uniqDiff(arr1, arr2) {
  var a2 = arr2.slice();
  return arr1.filter(function (item) {
    var index = a2.indexOf(item);
    if (index !== -1) {
      a2.splice(index, 1);
      return false;
    }
    return true;
  });
}

module.exports = TestCaseResults;