var child_process = require('child_process');
var superchild = require('superchild');
var path = require('path');
var clc = require('cli-color');
var _ = require('lodash');
var strings = require('./strings.js');

var log = function() {
  var outputPrefix = clc.bgYellow.black.bold(strings.LOG_PREFIX) + ' ';
  var args = [].slice.apply(arguments);
  args.unshift(outputPrefix);
  console.log.apply(console, args);
};

// TODO: validate test results
// TODO: get test/errorTesting results back to this runner (test results even when fatal/breaking error occurs?)

function TestRunner (env) {
  this.env = env || 'default';
  this.timeoutTime = 5000; // ms, time to wait for a run to finish before its killed
  this.nightwatchProcess = null;

  this._testCases = null; // array of tests to run
  this._timeoutId = null; // tracks timeoutTime

  _.bindAll(this, ['onTestError', 'onTestMessage', 'onTestClose', 'onTestExit', 'onTestTimeout']);
}

TestRunner.prototype.onTestError = function (err) {
  log('CHILD ERROR:', arguments);
};

TestRunner.prototype.onTestMessage = function (message, sendHandle) {
  log('CHILD MESSAGE:', arguments);
};

TestRunner.prototype.onTestClose = function (code, signal) {
  log('CHILD CLOSE:', arguments);
};

TestRunner.prototype.onTestExit = function (code, signal) {
  log('CHILD EXITED:', arguments);
  this._runNextTestCase();
};

TestRunner.prototype.onTestTimeout = function () {
  log('CHILD TIMEOUT:', arguments);
  this._killNightwatchProcess();
};

TestRunner.prototype.run = function (testCases) {
  log('STARTING');
  if (this._testCases) {
    throw new Error('Run already in progress');
  }

  this._testCases = this._normalizeTestCases(testCases);
  this._runNextTestCase();
};

TestRunner.prototype._runNextTestCase = function () {
  this._cleanupNightwatchProcess();

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

  // this.nightwatchProcess = child_process.spawn('./nightwatch', ['-e', this.env, '---conf', confStr], {
  //   cwd: './test/',
  //   stdio: ['inherit','inherit','inherit','ipc']
  // });
  this.nightwatchProcess = superchild(['./nightwatch', '-e', this.env, '---conf', confStrQt].join(' '), {
    cwd: './test/',
    stdio: 'inherit'
  });

  this._setupNightwatchProcess();
};

TestRunner.prototype._setupNightwatchProcess = function () {
  if (!this.nightwatchProcess) {
    return;
  }
  this.nightwatchProcess.on('error', this.onTestError);
  this.nightwatchProcess.on('message', this.onTestMessage);
  this.nightwatchProcess.on('exit', this.onTestExit);
  this.nightwatchProcess.on('close', this.onTestClose);

  this.nightwatchProcess.on('stdout_line', console.log.bind(console));
  this.nightwatchProcess.on('json_object', function(json) {
    console.log('[JSON] ' + JSON.stringify(json));
  });
  this.nightwatchProcess.on('stderr_data', console.error.bind(console));

  this._startTimeoutTimer();
};

TestRunner.prototype._cleanupNightwatchProcess = function () {
  this._stopTimeoutTimer();

  if (!this.nightwatchProcess) {
    return;
  }
  this.nightwatchProcess.removeListener('error', this.onTestError);
  this.nightwatchProcess.removeListener('message', this.onTestMessage);
  this.nightwatchProcess.removeListener('exit', this.onTestExit);
  this.nightwatchProcess.removeListener('close', this.onTestClose);

  this.nightwatchProcess = null;
};

TestRunner.prototype._killNightwatchProcess = function () {
  if (!this.nightwatchProcess) {
    return;
  }

  this.nightwatchProcess.close();

  //this.nightwatchProcess.kill('SIGINT');
  try {
    //process.kill(this.nightwatchProcess.pid, 'SIGINT');
    //child_process.spawn('pkill', ['-TERM', '-P', this.nightwatchProcess.pid]);
  }catch(e) {
    console.error('Could not kill process ' + this.nightwatchProcess.pid, e);
    //this.nightwatchProcess.kill('SIGINT');
  }
};

TestRunner.prototype._startTimeoutTimer = function () {
  this._timeoutId = setTimeout(this.onTestTimeout, this.timeoutTime);
};

TestRunner.prototype._stopTimeoutTimer = function () {
  clearTimeout(this._timeoutId);
};

TestRunner.prototype._normalizeTestCases = function (testCases) {
  if (!Array.isArray(testCases)) {
    testCases = [testCases];
  }
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

  _.merge(conf, testCase.conf || testCase.settings);
  _.merge(conf.test_settings[this.env], testCase.test_settings && (testCase.test_settings[this.env] || testCase.test_settings));
  _.merge(conf.test_settings[this.env].globals, testCase.globals);
  _.merge(conf.test_settings[this.env].globals.errorTesting, testCase.errorTesting);
  _.merge(conf.test_settings[this.env].globals.errorTesting.test, testCase.test);
  return conf;
};

module.exports = TestRunner;
