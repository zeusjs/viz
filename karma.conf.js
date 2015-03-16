// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html
'use strict';

module.exports = function ( config ) {
    config.set( {
        // base path, that will be used to resolve files and exclude
        basePath: '',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: [ 'jasmine' ],

        // list of files / patterns to load in the browser
        files: [
            'extern/libs/jquery.js',
            'extern/libs/angular.js',
            'extern/libs/angular-mocks.js',
            'extern/libs/d3.js',

            'src/js/*.js',
            // 'src/html/*.html',

            'test/spec/**/*.js',
            // 'test/mock_views/*.html',
            'test/fixtures/**/*.json'

        ],

        ngJson2JsPreprocessor: {
            cacheIdFromPath: function ( jsonPath ) {
                if ( jsonPath.indexOf( 'test/fixtures/' ) === 0 ) {
                    return jsonPath.replace( 'test/fixtures/', 'dummy/' );
                }
            }

        },

        ngHtml2JsPreprocessor: {
            // strip this from the file path
            stripPrefix: 'src/'
        },

        // list of files / patterns to exclude

        exclude: [],

        // web server port
        port: 8080,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_WARN,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [ 'PhantomJS' ],


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        reporters: [ 'progress', 'junit', 'coverage' ],

        preprocessors: {

            'src/js/*js': [ 'coverage' ],
            'test/fixtures/**/*.json': [ 'json2js' ],
            'src/html/*.html': [ 'ng-html2js' ],
            'test/mock_views/*.html': [ 'html2js' ]
        },


        plugins: [
            'karma-ng-json2js-preprocessor',
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-junit-reporter',
            'karma-coverage',
            'karma-ng-html2js-preprocessor',
            'karma-html2js-preprocessor'
        ],

        // the default configuration
        junitReporter: {
            outputFile: 'test-results.xml',
            suite: ''
        },

        coverageReporter: {
            type: 'cobertura',
            dir: '.coverage/'
        }
    } );
};
