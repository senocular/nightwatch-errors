module.exports = {

  errorTesting: require('./src/errorTesting.js'),

  before: function (done) {
    this.errorTesting.runHook('global', 'before', null, done);
  },
  beforeEach: function (browser, done) {
    this.errorTesting.runHook('global', 'beforeEach', browser, done);
  },
  afterEach: function (browser, done) {
    this.errorTesting.runHook('global', 'afterEach', browser, done);
  },
  after: function (done) {
    this.errorTesting.runHook('global', 'after', null, done);
  }
};
