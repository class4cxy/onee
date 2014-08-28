module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean : {
      src : ['src/disk']
    },
    concat : {
      disk : {
        src : ['src/*.js'],
        dest : 'src/online/seed.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> by jdo. */\n'
      },
      build: {
        src: 'src/online/seed.js',
        dest: 'src/online/seed.min.js'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify']);

};