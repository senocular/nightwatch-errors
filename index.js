var child_process = require('child_process');
var path = require('path');
var chalk = require('chalk');
var filename = path.basename(__filename);

var log = function() {
  var args = [].slice.apply(arguments);
  args.unshift(chalk.bgYellow.black.bold('[errorTesting]:') + ' ');
  console.log.apply(console, args);
};

var conf = {
  test_settings: {
    foo: {
      globals: {
        errorTesting: {
          output: true,
          test: {
            context: 'global',
            name:    'before',
            timing:  'sync',
            error:   'throw',
            count:   1
          }
        }
      }
    }
  }
};

var child = child_process.spawn('./nightwatch', ['-e', 'foo', '---conf', JSON.stringify(conf)], {
  cwd: './test/',
  env: process.env,
  stdio: ['inherit','inherit','inherit'] //,'ipc']
});

child.on('error', function (err) {
  log('CHILD ERROR:', arguments);
});
child.on('message', function (message, sendHandle) {
  log('CHILD MESSAGE:', arguments);
});
child.on('exit', function (code, signal) {
  log('CHILD EXITED:', arguments);
});
child.on('close', function (code, signal) {
  log('CHILD CLOSE:', arguments);
});