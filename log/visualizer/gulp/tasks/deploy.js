var gulp = require('gulp');
var config = require('../config').browserify;
var ghPages = require('gulp-gh-pages');

gulp.task('deploy', function() {
  return gulp.src(/*config.dest+*/'./build/*')
    .pipe(ghPages());
});
