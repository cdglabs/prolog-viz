var gulp = require('gulp');

gulp.task('build', ['browserify2', 'markup', 'less', 'fonts', 'muiFonts']);
