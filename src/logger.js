var strings = require('./strings.js');

module.exports = function(prefixFormat) {
  var outputPrefix = prefixFormat(strings.LOG_PREFIX);
  return function () {
    var args = [].slice.apply(arguments);
    args.unshift(outputPrefix);
    console.log.apply(console, args);
  };
};
