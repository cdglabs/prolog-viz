var gulp = require('gulp'),
  minifyCSS = require('gulp-minify-css'),
  less = require('gulp-less'),
  sourcemaps = require('gulp-sourcemaps'),
  handleErrors = require('../util/handleErrors'),
  config=require('../config').less;
var uglifycss = require('gulp-uglifycss');
var postcss      = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');

gulp.task('less', function() {
  return gulp.src(config.src)
    .pipe(sourcemaps.init())
    .pipe(less())
    .on('error', handleErrors)
    .pipe(postcss([ autoprefixer({ browsers: ['last 2 version'] }) ]))
    .pipe(uglifycss({
      maxLineLen: 80
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(config.dest));
});
