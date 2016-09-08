# Nightwatch Errors

End to end testing for [Nightwatch](http://nightwatchjs.org) that identifies the effects of different kinds of errors throughout the test lifecycle.


### Installation

Gab the repository and install dependencies:

```sh
$ git clone https://github.com/senocular/nightwatch-errors.git
$ cd nightwatch-errors
$ npm install
```

Add the necessary binaries. Currently, the configuration is set to run in chrome (Mac) with Selenium 2.53.1 as defined in `/test/nightwatch.json`.

* [/lib/selenium-server-standalone-2.53.1.jar](http://selenium-release.storage.googleapis.com/2.53/selenium-server-standalone-2.53.1.jar)
* [/lib/chromedriver](http://chromedriver.storage.googleapis.com/2.23/chromedriver_mac64.zip) (unpack)

_Additional binaries and information available from http://www.seleniumhq.org/download/_


### Run Tests

From the root directory run:

```sh
node ./index.js
```

This will start the end to end test runner which invokes separate nightwatch runs (as defined in `/src/testCases.js`) reporting the results in the console.


### Configuration

Most configuration is handled within the individual "test cases", where "test cases" here refers to the test cases of the end to end test runner.  These are defined in:

* `/src/testCases.js`

Each test case allows configuration properties to be set for each of the Nightwatch runs under test (base config at `/test/nightwatch.json`) as well as any settings used with the `errorTesting` framework used to manage what happens within the runs (`/test/src/errorTesting.js`) which is itself defined in `globals`.


### What's Tested

Each test case executes a Nightwatch run with two suites each with two cases (`/test/tests/` or `/test/tests-async`) which may (or may not) invoke some sort of error at any point in the run, either within the test cases themselves or any of the test hooks (before, afterEach, etc.).  After the run completes - either on its own or from timing out - the test case will automatically report on:

* Nightwatch's exit code
* Any leftover child processes (the existence of which indicates a failure)
* Any mismatch in hooks where the expectation is if a before gets run, its after counterpart should also always be run

Additionally, test cases can define an `expected` object which will make comparisons with the results of the run, comparing:

* expected exit code
* expected Nightwatch test results values
* expected methods (hooks and Nightwatch test cases) run, a.k.a. `history`

See `/src/testCases.js` for more information and examples.