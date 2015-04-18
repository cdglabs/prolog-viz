var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
// var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
// var sourcemaps = require('gulp-sourcemaps');
var assign = require('object-assign');
var config       = require('../config').browserify;
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var streamify = require('gulp-streamify');

// add custom browserify options here
var customOpts = {
  entries: config.bundleConfigs[0].entries,
  debug: config.debug
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

gulp.task('browserify2', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
  var condition = function (file) {
    return !config.debug;
  };

  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(config.bundleConfigs[0].outputName))
    .pipe(gulpif(condition,
      streamify(uglify({
        compress: {
          unused: false
        },
        // mangle: true,
        // output: {
        //   beautify: true,
        //   max_line_len: 80
        // }
      }))
    ))
    .pipe(gulp.dest(config.bundleConfigs[0].dest));
}
