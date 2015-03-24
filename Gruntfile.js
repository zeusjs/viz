'use strict';
/* jshint camelcase: false */

module.exports = function ( grunt ) {

    require( 'load-grunt-tasks' )( grunt );
    require( 'time-grunt' )( grunt );

    // Define the configuration for all the tasks
    grunt.initConfig( {

        pkg: grunt.file.readJSON( 'package.json' ),
        licenseHeaderLong: [ '/**',
            ' * Copyright (C) <%= grunt.template.today("yyyy") %>, Symantec Corporation',
            ' * All rights reserved.',
            ' *',
            ' * This source code is licensed under the MIT license found in the',
            ' * LICENSE file in the root directory of this source tree',
            ' */', '' ].join( '\n' ),

        licenseHeaderShort: [ '/*!',
            ' * Copyright (C) <%= grunt.template.today("yyyy") %>, Symantec Corporation',
            ' * All rights reserved.',
            ' * <%= pkg.name %> v<%= pkg.version %>',
            ' */', '' ].join( '\n' ),

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require( 'jshint-stylish' )
            },
            all: [
                'Gruntfile.js',
                'src/js/{,*/}*.js'
            ],
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: [ 'test/spec/{,*/}*.js' ]
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [ {
                    dot: true,
                    src: [
                        '.tmp',
                        'dist/*',
                        'docs',
                        'publish_docs',
                        '!dist/.git*'
                    ]
                } ]
            },
            server: '.tmp'
        },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: [ 'last 2 version' ]
            },
            dist: {
                files: [ {
                    expand: true,
                    cwd: '.tmp/css/',
                    src: '{,*/}*.css',
                    dest: '.tmp/css/'
                } ]
            }
        },

        // Compiles Sass to CSS and generates necessary files if requested
        sass: {
            options: { },
            dist: {
                files: {
                    '.tmp/css/zeus-viz.css': 'src/sass/index.scss'
                }
            }
        },


        concat: {
            options: {
                banner: '<%= licenseHeaderShort %>'
            },

            dist_js: {
                src: [ 'src/js/index.js', 'src/js/*.js' ],
                dest: '.tmp/js/zeus-viz.js'
            }
        },

        jscs: {
        src: [
                'app/js/{,*/}*.js',
                'test/spec/{,*/}*.js'
            ],
            options: {
                config: '.jscsrc'
            }
        },


        uglify: {
            options: {
                banner: '<%= licenseHeaderShort %>',
                compress: {
                    drop_console: true
                },
                preserveComments: false
            },

            dist: {
              files: {
                'dist/js/zeus-viz.min.js': [
                    '.tmp/js/zeus-viz.js'
                ]
              }
            }

        },

            // The following *-min tasks produce minified files in the dist folder
            cssmin: {
                options: {
                    root: '.',
                    keepSpecialComments: 0,
                    banner: '/*! Copyright (C) <%= grunt.template.today("yyyy") %>. ' +
                        'Symantec Corporation \n' +
                        '<%= pkg.name %> - v<%= pkg.version %>.' +
                        '<%= process.env.BUILD_NUMBER %> */\n'
                },

                target: {
                    files: {
                        'dist/css/zeus-viz.min.css': [ '.tmp/css/*.css' ]
                    }
                }
            },

            // ng-annotate tries to make the code safe for minification automatically
            // by using the Angular long form for dependency injection.
            ngAnnotate: {
                dist: {
                    files: [ {
                        expand: true,
                        cwd: '.tmp/js',
                        src: '*.js',
                        dest: '.tmp/js'
                    } ]
                }
            },

            ngdocs: {
                options: {
                    dest: 'docs',
                    html5Mode: false,
                    title: 'Zeus Viz',
                    startPage: '/api',
                    editExample: false,
                    styles: [
                        'dist/css/zeus-viz.css'
                    ],
                    scripts: [
                        'extern/libs/jquery.js',
                        'extern/libs/d3.js',
                        'extern/libs/d3_tip.js',
                        'extern/libs/angular.js',
                        'extern/libs/angular-animate.js',
                        'dist/js/zeus-viz.js'
                    ]
                },
                api: [
                  'src/js/*.js'
                ]
            },

            sloc: {
                javascript: {
                    files: {
                        src: [
                            'js/**/*.js',
                            'js/*.js'
                        ]
                    }
                },
                styles: {
                    files: {
                        src: [
                            'sass/**/*.scss',
                            'sass/*.scss'
                        ]
                    }
                }
            },

            // Copies remaining files to places other tasks can use
            copy: {


                // docs: {
                //     files: [
                //     {
                //         expand: true,
                //         flatten: true,
                //         cwd: '.tmp/concat/scripts',
                //         dest: 'docs/js',
                //         src: [ '*.js' ]
                //     },
                //     {
                //         expand: true,
                //         flatten: true,
                //         cwd: 'dist/css',
                //         dest: 'docs/css',
                //         src: [ '*.css' ]
                //     } ]
                // },

                build: {
                    files: [
                        {
                            expand: true,
                            flatten: true,
                            cwd: 'src/sass',
                            dest: 'dist/sass',
                            src: [ '*.scss' ]
                        },
                        {
                            expand: true,
                            flatten: true,
                            cwd: '.tmp/css',
                            dest: 'dist/css',
                            src: [ '*.css' ]
                        },
                        {
                            expand: true,
                            flatten: true,
                            cwd: 'src/html',
                            dest: 'dist/html',
                            src: [ '*.html' ]
                        },
                        {
                            expand: true,
                            flatten: true,
                            cwd: '.tmp/js',
                            dest: 'dist/js',
                            src: [ '*.js' ]
                        }

                    ]
                }

            },


            // Test settings
            karma: {
                unit: {
                    configFile: 'karma.conf.js',
                    singleRun: true
                }
            },


            connect: {
                options: {
                    port: 9000,
                    // Change this to '0.0.0.0' to access the server from outside.
                    hostname: 'localhost',
                    livereload: 35729
                },
                livereload: {
                    options: {
                        open: true,
                        base: [
                            '.tmp',
                            'src'
                        ]
                    }
                },
                test: {
                    options: {
                        port: 9001,
                        base: [
                            '.tmp',
                            'test',
                            'dist'
                        ]
                    }
                },
                dist: {
                    options: {
                        base: 'dist'
                    }
                }
            }
        } );


        grunt.registerTask( 'lint', [
            'jscs',
            'jshint:all'
        ] );

        grunt.registerTask( 'test', [
            'lint',
            'jshint:test'
            // 'karma'
        ] );

        grunt.registerTask( 'docs', [
            'ngdocs'
        ] );

        grunt.registerTask( 'build', [
            'lint',
            // 'karma',
            'clean',
            'sass',
            'autoprefixer',
            'concat',
            'ngAnnotate',
            'copy:build',
            'cssmin',
            'uglify',
            'docs',
            'sloc'
        ] );
    };
