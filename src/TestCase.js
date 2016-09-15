var superchild = require('superchild');
var psTree = require('ps-tree');
var _ = require('lodash');
var clc = require('cli-color');
var log = require('./logger.js')(clc.bgYellow.black.bold);
var fail = clc.red;

var TestCaseResults = require('./TestCaseResults.js');
var ErrorTest = require('./ErrorTest.js');

var CHILD_PROC_POLL = 250;  // interval to poll nw process for child processes
var TEST_CASE_TIMEOUT = 5000;

function TestCase(desc) {

  this.env = 'default'; // nw environment passed to nw call
  this.timeoutTime = TEST_CASE_TIMEOUT; // ms, time to wait for a run to finish before its killed

  desc = desc || {};
  this.disabled = desc.disabled || false;
  this.name = desc.name || '<unnamed>';
  this.test = desc.test || null;

  this.buildConf(desc);
  this.results = new TestCaseResults(desc);

  this._timeoutId = null;         // tracks timeoutTime
  this.nightwatchProcess = null;  // reference to spawned nw child process running the test
  this._nwPID = null;             // process id of current nw process
  this._childProcesses = [];      // list of child processes in nw process tree
  this._runCompleteCallback = null;

  _.bindAll(this, ['_onTestOut', '_onTestError', '_onTestMessage', '_onTestExit', '_onTestTimeout']);
}

TestCase.prototype.getResults = function() {
  return this.results;
};

TestCase.prototype.run = function (runCompleteCallback) {

  this._runCompleteCallback = runCompleteCallback;

  var confStr = JSON.stringify(this._conf);
  var confStrQt = "'" + confStr.replace("'", "\\'") + "'";

  var cmd = ['./nightwatch', '-e', this.env, '---conf', confStrQt];
  this.nightwatchProcess = superchild(cmd.join(' '), { cwd: './test/' });
  this._setupNightwatchProcess();
};

TestCase.prototype._onTestOut = function (outStr) {
  console.log(outStr);
};

TestCase.prototype._onTestError = function (errStr) {
  console.error(errStr);
};

TestCase.prototype._onTestMessage = function (json) {
  switch (json.type) {
    case 'test':
      this.results.update(json.value);
      break;

    default:
      log('Unknown message received:', JSON.stringify(json));
  }
};

TestCase.prototype._onTestExit = function (code, signal) {
  this._cleanupNightwatchProcess();

  this.results.setExit(code, signal, this._childProcesses);

  if (this._runCompleteCallback) {
    this._runCompleteCallback(this);
  }
};

TestCase.prototype._onTestTimeout = function () {
  log(fail('TIMEOUT') + ' after ' + this.timeoutTime  + 'ms.');

  this._nwPID = null; // stops additional child proc polling
  this._killNightwatchProcess();
};

TestCase.prototype._setupNightwatchProcess = function () {
  this._childProcesses = [];

  if (!this.nightwatchProcess) {
    return;
  }

  this._nwPID = this.nightwatchProcess.pid;

  this.nightwatchProcess.on('stdout_line', this._onTestOut);
  this.nightwatchProcess.on('stderr_data', this._onTestError);
  this.nightwatchProcess.on('json_object', this._onTestMessage);
  this.nightwatchProcess.on('exit', this._onTestExit);

  this._startTimeoutTimer();
  this._captureChildren();
};

TestCase.prototype._cleanupNightwatchProcess = function () {
  this._stopTimeoutTimer();
  this._nwPID = null;
  this._killNightwatchChildProcesses();

  if (!this.nightwatchProcess) {
    return;
  }

  this.nightwatchProcess.removeListener('stdout_line', this._onTestOut);
  this.nightwatchProcess.removeListener('stderr_data', this._onTestError);
  this.nightwatchProcess.removeListener('json_object', this._onTestMessage);
  this.nightwatchProcess.removeListener('exit', this._onTestExit);

  this.nightwatchProcess = null;
};

TestCase.prototype._killNightwatchProcess = function () {
  if (!this.nightwatchProcess) {
    return;
  }

  this.nightwatchProcess.close();
};

TestCase.prototype._killNightwatchChildProcesses = function () {
  this._childProcesses = this._childProcesses.filter(function (processInfo) {
    try {
      process.kill(processInfo.PID);
      return true; // leftover process
    } catch (alreadyDead) {}
    return false;
  });
};

TestCase.prototype._captureChildren = function () {
  var nwPID = this._nwPID;
  if (nwPID !== null) {

    psTree(nwPID, function (err, children) {
      if (nwPID === this._nwPID) {
        if (!err && children.length) {
          this._childProcesses = children;
        }
        // polling; not sure if there's a better way
        setTimeout(this._captureChildren.bind(this), CHILD_PROC_POLL);
      }

    }.bind(this));
  }
};

TestCase.prototype._startTimeoutTimer = function () {
  this._stopTimeoutTimer();
  this._timeoutId = setTimeout(this._onTestTimeout, this.timeoutTime);
};

TestCase.prototype._stopTimeoutTimer = function () {
  clearTimeout(this._timeoutId);
};

TestCase.prototype.buildConf = function (desc) {
  var conf = {
    test_settings: {}
  };
  conf.test_settings[this.env] = {
    globals: {
      errorTesting: {
        test: {}
      }
    }
  };

  var errorTest = desc.test;

  if (errorTest && ErrorTest.targetsAsyncHook(errorTest)) {
      conf.src_folders = ['tests-async'];
  }

  _.merge(conf, desc.conf || desc.settings);
  _.merge(conf.test_settings[this.env], desc.test_settings && (desc.test_settings[this.env] || desc.test_settings));
  _.merge(conf.test_settings[this.env].globals, desc.globals);
  _.merge(conf.test_settings[this.env].globals.errorTesting, desc.errorTesting);
  _.merge(conf.test_settings[this.env].globals.errorTesting.test, errorTest);

  this._conf = conf;
};

module.exports = TestCase;