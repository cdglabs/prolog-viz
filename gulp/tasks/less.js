var gulp = require('gulp'),
  less = require('gulp-less'),
  sourcemaps = require('gulp-sourcemaps'),
  handleErrors = require('../util/handleErrors'),
  config=require('../config').less;
var uglifycss = require('gulp-uglifycss');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');
var gutil = require('gulp-util');

gulp.task('less', function() {
  return gulp.src(config.src)
    .pipe(config.debug ? sourcemaps.init() : gutil.noop())
    .pipe(less())
    .on('error', handleErrors)
    .pipe(postcss([ autoprefixer({ browsers: ['last 2 version'] }) ]))
    .pipe(uglifycss({
      maxLineLen: 80
    }))
    .pipe(config.debug ? sourcemaps.write() : gutil.noop())
    .pipe(gulp.dest(config.dest));
});
