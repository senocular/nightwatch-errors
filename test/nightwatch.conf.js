var _ = require('lodash');

module.exports = (function(settings) {

  try {
    var argv = process.argv;
    var confIndex = argv.indexOf('---conf');
    if (confIndex > -1 && confIndex < argv.length - 1) {
      var confStr = argv[confIndex + 1];
      var conf = JSON.parse(confStr);
      _.merge(settings, conf);
    }
  }catch(err){
    console.error('Could not load configuration values: ', err);
  }

  return settings;
})(require('./nightwatch.json'));
