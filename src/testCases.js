var ErrorTest = require('./ErrorTest.js');
var commonResults = require('./commonResults.js');
var History = commonResults.History;
var Results = commonResults.Results;

/*
  Test case object (all properties optional):

  {

    // general

    name: name used when logging to help you distinguish between different tests
    disabled: When true, the test case does not run. When not defined/false, the test case runs
    test: An ErrorTest instance (POJOs ok) identifying the location where an error occurs and
          how that error manifests itself (this is equivalent to errorTesting.test). See
          /test/src/errorTesting.js for more information.

    // settings

    settings: root nightwatch.json settings values to be used with the test run on top of the existing
              nightwatch.json definition. This object can be deep, though additional shortcuts (below)
              can be used for the nested definitions.
    test_settings: test settings (in nightwatch.json) to be used with the test run (these values would
                   go into settings.test_settings[env]).
    globals: global values to be used with the test run (settings.test_settings[env].globals).
    errorTesting: properties to be used for the errorTesting definition (stored in globals) used to run
                  the test (settings.test_settings[env].globals.errorTesting; see errorTesting.js).

    // results

    expected: Optional object containing expectations for the test run identifying pass/fail conditions.
      {
        history: Array of full method names (e.g. 'global.beforeEach') that will match those produced by
                 the test run indicating all of the hooks/test methods that run for the test run.
        results: Object with a deep equals match (non-inclusive) of values matching the results in
                 currentTest objects produced by a test run.  Each currentTest object is stored in the
                 results object using its module name as a key, e.g. results.suite1 = currentTest for the
                 module named suite1.js.
        exitCode: Exit code for nightwatch process
      }
  }
*/

var testCases = [
  {
    disabled: false,
    name: 'sanity',
    expected: {
      history: History.ALL,
      results: Results.ALL_PASS,
      exitCode: 0
    }
  },
  {
    name: 'skip true',
    test: new ErrorTest('suite1', 'testcase1', 'sync', 'expect'),
    settings: {
      skip_testcases_on_fail: true
    },
    expected: {
      history: History.SKIP_S1T2,
      exitCode: 1
    }
  },
  {
    // issue #916 (closed)
    name: 'skip false',
    test: new ErrorTest('suite1', 'testcase1', 'sync', 'expect'),
    settings: {
      skip_testcases_on_fail: false
    },
    expected: {
      history: History.ALL,
      exitCode: 1
    }
  },
  {
    test: new ErrorTest('suite', 'beforeEach', 'sync-done', 'throw')
  },
  {
    test: new ErrorTest('global', 'afterEach', 'sync', 'throw')
  },
  {
    disabled: false,
    name: 'testcase:timeout',
    test: new ErrorTest('suite1', 'testcase1', 'timeout')
  }
];

//testCases.only = 'sanity'; // runs only the test matching this name, or names if an array
module.exports = testCases;
