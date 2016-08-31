module.exports = {
  test: function (browser) {
    browser.assert.ok(1);
  },

  after: function (browser) {
    console.log('AFTER:', new Error().stack);
    browser.end();
  }
};
