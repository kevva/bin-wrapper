'use strict';

var Bin = require('./');
var exists = require('fs').exists;
var path = require('path');
var test = require('ava');

test('expose a constructor', function (t) {
    t.plan(1);
    t.assert(typeof Bin === 'function');
});

test('add a source', function (t) {
    t.plan(1);

    var bin = new Bin()
        .src('http://example.com/gifsicle.tar.gz');

    t.assert(bin._src[0].url === 'http://example.com/gifsicle.tar.gz');
});

test('add a source to a specific os', function (t) {
    t.plan(1);

    var bin = new Bin()
        .src('http://example.com/gifsicle.tar.gz', process.platform);

    t.assert(bin._src[0].os === process.platform);
});

test('set destination directory', function (t) {
    t.plan(1);

    var bin = new Bin()
        .dest(path.join(__dirname, 'tmp'));

    t.assert(bin._dest === path.join(__dirname, 'tmp'));
});

test('set which file to use as the binary', function (t) {
    t.plan(1);

    var bin = new Bin()
        .use('gifsicle');

    t.assert(bin._use === 'gifsicle');
});

test('can use existing binary', function(t) {
    t.plan(2);

    // add file with same name
    var fs = require('fs');
    var mkdir = require('mkdirp');

    var destDir = path.join(__dirname, 'tmp');
    var destFile = 'test-bin.bat';
    var destFilePath = path.join(destDir, destFile);
    mkdir(destDir, function() {
        var fd = fs.openSync(destFilePath, 'w');
        fs.close(fd);
        if (process.platform !== 'win32') {
            fs.chmodSync(destFilePath, '777');
        }
    });

    // use the same path. Shouldn't download anything.
    var bin = new Bin()
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/osx/gifsicle', 'darwin')
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/linux/x64/gifsicle', 'linux', 'x64')
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/win/x64/gifsicle.exe', 'win32', 'x64')
        .dest(destDir)
        .use(destFile)
        .run([], function(err) {
            t.assert(!err, err);

            fs.stat(destFilePath, function(err, a) {
                t.assert(a.size === 0, 'Incorrect size');
            });
        });
});

test('should verify that a binary is working', function (t) {
    t.plan(2);

    var bin = new Bin()
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/osx/gifsicle', 'darwin')
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/linux/x64/gifsicle', 'linux', 'x64')
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/win/x64/gifsicle.exe', 'win32', 'x64')
        .dest(path.join(__dirname, 'tmp'))
        .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

    bin.run(['--version'], function (err) {
        t.assert(!err, err);

        exists(bin.path(), function (exist) {
            t.assert(exist);
        });
    });
});

test('should download and extract an archive', function (t) {
    t.plan(2);

    var bin = new Bin({ strip: 1 })
        .src('https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-macosx.zip', 'darwin')
        .src('https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-windows.zip', 'win32')
        .src('https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-x86_64.tar.bz2', 'linux', 'x64')
        .src('https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7-linux-i686.tar.bz2', 'linux', 'x86')
        .dest(path.join(__dirname, 'tmp'))
        .use(process.platform === 'win32' ? 'phantomjs.exe' : 'bin/phantomjs');

    bin.run(['--version'], function (err) {
        t.assert(!err, err);

        exists(bin.path(), function (exist) {
            t.assert(exist);
        });
    });
});

test('should meet the desired version', function (t) {
    t.plan(2);

    var bin = new Bin()
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/osx/gifsicle', 'darwin')
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/linux/x64/gifsicle', 'linux', 'x64')
        .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/win/x64/gifsicle.exe', 'win32', 'x64')
        .dest(path.join(__dirname, 'tmp'))
        .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
        .version('>=1.71');

    bin.run(['--version'], function (err) {
        t.assert(!err, err);

        exists(bin.path(), function (exist) {
            t.assert(exist);
        });
    });
});
