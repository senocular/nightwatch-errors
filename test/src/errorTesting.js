var clc = require('cli-color');
var log = require('../../src/logger.js')(clc.bgYellow.black);
var logJSON = function (json) {
  console.log(JSON.stringify(json));
};

var BROWSER_REQUIRED = 'WARNING browser required for this test; not present';

module.exports = {
  errorTimeout: 50,   // time to wait before generating an async error
  output: true,       // when true, logs the test/hook steps
  outputJSON: false,  // when true, logs the test/hook steps in JSON format (independent of output)
  outputSettings: false, // when true, the settings JSON is logged in the output; must get set for nightwatch.conf.js (not here)
  history: [],        // list of full names of methods run in the test run, e.g. suite.beforeEach
  testcases: {},      // map of currentTest objects for each test case keyed by full name

  // meta:
  contexts: ['global', 'suite'],                             // or test suite name when using testcase name for name
  names:    ['before', 'beforeEach', 'afterEach', 'after'],  // only applies to 'global' and 'suite'
                                                             // or test case name when context is test suite name
  timings:  ['timeout', 'sync', 'sync-done', 'async'],       // 'sync-done' uses hook with a done param, but calls done async
  errors:   ['throw', 'expect', 'done', 'assert', 'verify',  // ignored for 'timeout'
             'assert-sync', 'verify-sync'],                  // only 'throw', 'done' supported for global.before, global.after

  /* Set by individual tests to determine what error to test
     (array of these objects also works):

  test: {
    context: 'global',
    name:    'beforeEach',
    timing:  'async',
    error:   'throw'
  }
  */

  runHook: function (context, name, browser, done) {

    var test = this._findMatchingTest(context, name);
    this._logTest(context, name, test, browser && browser.currentTest);

    if (test) {

      switch (test.timing) {
      case 'timeout':
        return;

      case 'sync':
      case 'sync-done':
        this._generateError(test, browser, done);
        return;

      case 'async':
        setTimeout(function(){
          this._generateError(test, browser, done);
        }.bind(this), this.errorTimeout);
        return;
      }
    }

    // TODO: Where is the best place to try to call this?
    var fullName = this._getFullName(context, name);
    if (fullName === 'global.afterEach') {
      if (browser && typeof browser.end === 'function') {
        browser.end();
      }
    }

    this._callDone(browser, done);
  },

  runTest: function (browser, done) {

    var currentTest = browser.currentTest;
    var context = currentTest.module;
    var name = currentTest.name;
    
    var test = this._findMatchingTest(context, name);
    this._logTest(context, name, test, currentTest);

    if (test) {

      switch (test.timing) {
      case 'timeout':
        browser.perform(function(browser, done) {
          
        });
        return;

      case 'sync':
      case 'sync-done':
        this._generateError(test, browser);
        return;

      case 'async':
        browser.perform(function(_browser, _done) {
          setTimeout(function(){
            this._generateError(test, browser, done);
            _done();
          }.bind(this), this.errorTimeout);
        }.bind(this));
        return;
      }
    }

    browser.assert.ok(true);
  },

  _findMatchingTest: function (context, name) {

    var test = this.test;

    if (!test || !context || !name) {
      return false;
    }

    if (!Array.isArray(test)) {
      test = [test];
    }

    var matchingTests = test.filter(function(test){
      return this._findMatchingTestSingle(test, context, name);
    }.bind(this));

    return matchingTests.length > 0 ? matchingTests[0] : null;
  },

  _findMatchingTestSingle: function (test, context, name) {

    if (!test) {
      return false;
    }

    var currName = this._getFullName(context, name);
    var testName = this._getFullName(test.context, test.name);

    if (currName === testName) {
      return true;
    }

    return false;
  },

  _logTest: function (context, name, matchedErrorTest, currentTest) {

    var fullName = this._getFullName(context, name);
    this.history.push(fullName);

    if (currentTest) {
      this.testcases[fullName] = currentTest;
    }

    if (this.output) {

      var msg = fullName;
      if (matchedErrorTest) {
        msg += ' Matches: ' + JSON.stringify(matchedErrorTest);
      }
      log(msg);
    }

    if (this.outputJSON) {

      logJSON({
        type: 'test',
        value: {
          history: this.history,
          errorTest: {
            name: matchedErrorTest && fullName,
            test: matchedErrorTest,
          },
          currentTest: currentTest
        }
      });
    }
  },

  _getFullName: function(context, name) {
    return context + (name ? '.' + name : '');
  },

  _generateError: function(test, browser, done) {

    var testStr = JSON.stringify(test);
    var doneErr;

    switch (test.error) {
    case 'throw':
      throw new Error('Message thrown for ' + testStr + '.');

    case 'assert':
      if (browser) {
        browser.assert.elementPresent('#does-not-exist');
      } else log(BROWSER_REQUIRED);
      break;

    case 'verify':
      if (browser) {
        browser.verify.elementPresent('#does-not-exist');
      } else log(BROWSER_REQUIRED);
      break;

    case 'assert-sync':
      if (browser) {
        browser.assert.ok(false, 'Assert-sync failure for ' + testStr + '.');
      } else log(BROWSER_REQUIRED);
      break;

    case 'verify-sync':
      if (browser) {
        browser.verify.ok(false, 'Verify-sync failure for ' + testStr + '.');
      } else log(BROWSER_REQUIRED);
      break;

    case 'expect':
      if (browser) {
        browser.expect.element('#does-not-exist').to.be.present.before(1);
      } else log(BROWSER_REQUIRED);
      break;

    case 'done':
      doneErr = new Error('Message passed to done for ' + testStr + '.');
      break;
    }

    this._callDone(browser, done, doneErr);
  },

  _callDone: function (browser, done, doneErr) {

    if (done) {

      var callDone = function () {
        if (doneErr) {
          setImmediate(done, doneErr);
        } else {
          setImmediate(done);
        }
      };

      if (browser) {
        browser.perform(callDone);
      } else {
        callDone();
      }

    }
  }
};