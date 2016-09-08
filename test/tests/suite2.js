module.exports = {

  'testcase1': function (browser) {
    browser.globals.errorTesting.runTest(browser);
  },

  'testcase2': function (browser) {
    browser.globals.errorTesting.runTest(browser);
  },

  before: function (browser) {
    browser.globals.errorTesting.runHook('suite', 'before', browser);
  },
  beforeEach: function (browser) {
    browser.globals.errorTesting.runHook('suite', 'beforeEach', browser);
  },
  afterEach: function () { // boo!
    this.client.globals.errorTesting.runHook('suite', 'afterEach', this.client);
  },
  after: function (browser) {
    browser.globals.errorTesting.runHook('suite', 'after', browser);
  }
};
