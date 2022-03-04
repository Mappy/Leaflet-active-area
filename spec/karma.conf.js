// Karma configuration
module.exports = function (config) {

    var files = [
        "node_modules/leaflet/dist/leaflet-src.js",
        "src/leaflet.activearea.js",
        "spec/suites/**/*.js",
        {pattern: "node_modules/leaflet/dist/images/*.png", included: false}
    ];

    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '../',

        plugins: [
            'karma-mocha',
            'karma-chrome-launcher',
            'karma-expect'
        ],

        // frameworks to use
        frameworks: ['mocha', 'expect'],

        // list of files / patterns to load in the browser
        files: files,
        exclude: [],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['dots'],

        // web server port
        port: 9876,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_WARN,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        //browsers: ['PhantomJS'],
        browsers: ['ChromeHeadless'],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 5000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};
