var dest = './build',
src = './src',
mui = './node_modules/material-ui/src';
var gutil = require('gulp-util');

// TODO: set a flag: gulp-util, env.target, isProduction

module.exports = {
  browserSync: {
    server: {
      // We're serving the src folder as well
      // for sass sourcemap linking
      baseDir: [dest, src]
    },
    files: [
    dest + '/**'
    ]
  },
  less: {
    src: src + '/less/main.less',
    watch: [
    src + '/less/**',
    mui + '/less/**'
        ],
    dest: dest,
    debug: gutil.env.type !== 'production'
  },
  markup: {
    src: src + "/www/**",
    dest: dest
  },
  fonts: {
    src: mui + 'less/material-design-fonticons/fonts/**',
    dest: dest + '/fonts/mdfonticon'
  },
  muiFonts: {
    src: mui + '/less/material-ui-icons/fonts/**',
    dest: dest + '/fonts'
  },

  browserify: {
    // Enable source maps
    debug: gutil.env.type !== 'production',
    // A separate bundle will be generated for each
    // bundle config in the list below
    bundleConfigs: [{
      entries: src + '/app/app.jsx',
      dest: dest,
      outputName: 'app.js'
    }]
  }
};
