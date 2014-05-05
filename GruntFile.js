module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            dist: 'dist/'
        },
        concat: {
            js: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                src: [
                    'src/js/core.js',
                    'src/js/nv.d3.js',
                    'src/js/**/*.js'
                ],
                dest: 'dist/js/<%= pkg.name %>.js'
            },
            css: {
                src: [ 'src/css/**/*.css' ],
                dest: 'dist/css/<%= pkg.name %>.css'
            }
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            js: {
                src: '<%= concat.js.dest %>',
                dest: 'dist/js/<%= pkg.name %>.min.js'
            }
        },
        cssmin: {
            css: {
                src: '<%= concat.css.dest %>',
                dest: 'dist/css/<%= pkg.name %>.min.css'
            }
        },
        copy: {
            img: {
                expand: true,
                cwd: 'src/',
                src: 'img/**/*',
                dest: 'dist/'
            }
        },
        jshint: {
            foo: {
                src: "src/js/**/*.js"
            },
            options: {
                jshintrc: '.jshintrc'
            }
        },
        watch: {
            js: {
                files: [ 'src/js/*.js', 'src/css/charts.css' ],
                tasks: [ 'concat' ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['clean','concat','uglify','cssmin','copy']);
    grunt.registerTask('production', ['clean','concat', 'uglify','cssmin','copy']);
    grunt.registerTask('lint', ['jshint']);
};
