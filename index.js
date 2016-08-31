var TestRunner = require('./src/TestRunner.js');
var testCases = require('./src/testCases.js');

var runner = new TestRunner();
runner.run(testCases);
