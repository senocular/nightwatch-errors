var child_process = require('child_process');
var superchild = require('superchild');
var psTree = require('ps-tree');
var path = require('path');
var _ = require('lodash');
var clc = require('cli-color');
var log = require('./logger.js')(clc.bgYellow.black.bold);

// TODO: validate test results
// TODO: get test/errorTesting results back to this runner (test results even when fatal/breaking error occurs?)

function TestRunner (env) {
  this.env = env || 'default'; // nightwatch environment passed to nightwatch call
  this.timeoutTime = 5000; // ms, time to wait for a run to finish before its killed
  this.nightwatchProcess = null; // reference to spawned nightwatch child process running the test
  this._nwPID = null;
  this._childProcesses = [];

  this._testCases = null; // array of tests to run
  this._timeoutId = null; // tracks timeoutTime

  _.bindAll(this, ['onTestOut', 'onTestError', 'onTestMessage', 'onTestExit', 'onTestTimeout']);
}

TestRunner.prototype.onTestOut = function (outStr) {
  console.log(outStr);
};

TestRunner.prototype.onTestError = function (errStr) {
  console.error(errStr);
};

TestRunner.prototype.onTestMessage = function (json) {
  log('onTestMessage:', JSON.stringify(json));
};

TestRunner.prototype.onTestExit = function (code, signal) {
  log('onTestExit:', arguments);
  this._collateResults();
  this._cleanupNightwatchProcess();
  this._runNextTestCase();
};

TestRunner.prototype.onTestTimeout = function () {
  log('onTestTimeout:', arguments);
  this._killNightwatchProcess();
};

TestRunner.prototype._captureChildren = function () {
  var nwPID = this._nwPID;
  if (nwPID !== null) {

    psTree(nwPID, function (err, children) {
      if (nwPID === this._nwPID) {
        if (!err && children.length) {
          this._childProcesses = children;
        }
        setTimeout(this._captureChildren.bind(this), 500);
      }

    }.bind(this));
  }
};

TestRunner.prototype.run = function (testCases) {
  if (this._testCases) {
    throw new Error('Run already in progress');
  }

  this._testCases = this._normalizeTestCases(testCases);
  log('STARTING:', this._testCases.length + ' test cases');
  this._runNextTestCase();
};

TestRunner.prototype._runNextTestCase = function () {

  if (!this._testCases.length) {
    this._testCases = null;
    log('COMPLETE');
    return;
  }

  var testCase = this._testCases.shift();
  this._runTestCase(testCase);
};

TestRunner.prototype._runTestCase = function (testCase) {

  log('RUNNING:', testCase.name || '<unnamed testCase>');

  var conf = this._buildConf(testCase);
  var confStr = JSON.stringify(conf);
  var confStrQt = "'" + confStr + "'";

  log('---conf', confStrQt);

  var cmd = ['./nightwatch', '-e', this.env, '---conf', confStrQt];
  this.nightwatchProcess = superchild(cmd.join(' '), { cwd: './test/' });
  this._setupNightwatchProcess();
};

TestRunner.prototype._setupNightwatchProcess = function () {
  if (!this.nightwatchProcess) {
    return;
  }

  this._nwPID = this.nightwatchProcess.pid;
  this.nightwatchProcess.on('stdout_line', this.onTestOut);
  this.nightwatchProcess.on('stderr_data', this.onTestError);
  this.nightwatchProcess.on('json_object', this.onTestMessage);
  this.nightwatchProcess.on('exit', this.onTestExit);

  this._startTimeoutTimer();
  this._captureChildren();
};

TestRunner.prototype._cleanupNightwatchProcess = function () {
  this._stopTimeoutTimer();
  this._nwPID = null;
  this._killNightwatchChildProcesses();

  if (!this.nightwatchProcess) {
    return;
  }

  this.nightwatchProcess.removeListener('stdout_line', this.onTestOut);
  this.nightwatchProcess.removeListener('stderr_data', this.onTestError);
  this.nightwatchProcess.removeListener('json_object', this.onTestMessage);
  this.nightwatchProcess.removeListener('exit', this.onTestExit);

  this.nightwatchProcess = null;
};

TestRunner.prototype._killNightwatchProcess = function () {
  if (!this.nightwatchProcess) {
    return;
  }

  this.nightwatchProcess.close();
};

TestRunner.prototype._killNightwatchChildProcesses = function () {
  this._childProcesses.forEach(function (processInfo) {
    try {
      process.kill(processInfo.PID);
    } catch (ignore) {}
  });
};

TestRunner.prototype._startTimeoutTimer = function () {
  this._timeoutId = setTimeout(this.onTestTimeout, this.timeoutTime);
};

TestRunner.prototype._stopTimeoutTimer = function () {
  clearTimeout(this._timeoutId);
};

TestRunner.prototype._collateResults = function () {
  log('RESULTS: TODO...');
};

TestRunner.prototype._normalizeTestCases = function (testCases) {

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

  return testCases;
};

TestRunner.prototype._buildConf = function (testCase) {
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

  var errorTest = testCase.test;

  if (errorTest && errorTest.targetsAsyncHook()) {
      conf.src_folders = ['tests-async'];
  }

  _.merge(conf, testCase.conf || testCase.settings);
  _.merge(conf.test_settings[this.env], testCase.test_settings && (testCase.test_settings[this.env] || testCase.test_settings));
  _.merge(conf.test_settings[this.env].globals, testCase.globals);
  _.merge(conf.test_settings[this.env].globals.errorTesting, testCase.errorTesting);
  _.merge(conf.test_settings[this.env].globals.errorTesting.test, errorTest);

  return conf;
};

module.exports = TestRunner;
