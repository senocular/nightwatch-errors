var _ = require('lodash');

module.exports = (function(settings) {

  try {
    var argv = process.argv;
    var confIndex = argv.indexOf('---conf');
    if (confIndex > -1 && confIndex < argv.length - 1) {
      var confValue = argv[confIndex + 1];
      var conf = JSON.parse(confValue);
      _.merge(settings, conf);
    }
  }catch(err){
    console.error('Could not capture configuration values from ---conf argument: ', err);
  }

  return settings;
})(require('./nightwatch.json'));
