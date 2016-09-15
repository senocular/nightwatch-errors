var _ = require('lodash');

module.exports = (function(settings) {

  // merge in test cases settings JSON
  try {
    var argv = process.argv;
    var confIndex = argv.indexOf('---conf');
    if (confIndex > -1 && confIndex < argv.length - 1) {
      var confValue = argv[confIndex + 1];
      var conf = JSON.parse(confValue);
      _.merge(settings, conf);
    }
  }catch(err){
    console.error('ERROR: Could not capture configuration values from ---conf argument: ', err);
  }

  // output the settings if required
  try {
    var env = 'default';
    if (settings.test_settings[env].globals.errorTesting.outputSettings) {
      console.log(settings);
    }
  } catch (ignore) {}

  return settings;
})(require('./nightwatch.json'));
