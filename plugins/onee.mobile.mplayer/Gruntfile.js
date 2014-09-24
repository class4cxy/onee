module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean : {
      src : ['./online']
    },
    useminPrepare: {
        options: {
            dest: './online'
        },
        html: ['index.html']
    },
    copy: {
      main: {
        files: [
          {expend: true, src: "./index.html", dest: "./online/"},
          {expend: true, src: "./images/*.{jpg,gif,png}", dest: "./online/"},
          {expend: true, src: "./sources/*.{wav,mp3}", dest: "./online/"}
        ]
      }
    },
    filerev: {
        options: {
            encoding: 'utf8',
            algorithm: 'md5',
            length: 4
        },
        dist: {
            src: [
                './online/*.js',
                './online/*.css',
                './online/sources/*.mp3',
                './online/images/*.{jpg,jpeg,png,gif}'
            ]
        }
    },
    usemin: {
      html: './online/*.html',
      css: './online/*.css'
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'online/index.html': 'online/index.html'
        }
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  // Default task(s).
  grunt.registerTask('default', [
      'clean',
      'useminPrepare',
      'concat:generated',
      'cssmin:generated',
      'uglify:generated',
      'copy',
      'filerev',
      'usemin',
      'htmlmin'
    ]);
};