/* global afterEach, describe, it */
'use strict';

var assert = require('assert');
var Bin = require('./');
var fs = require('fs');
var path = require('path');
var rm = require('rimraf');

describe('BinWrapper()', function () {
    afterEach(function (cb) {
        rm(path.join(__dirname, 'tmp'), cb);
    });

    it('should verify that a binary is working', function (cb) {
        var bin = new Bin()
            .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/osx/gifsicle', 'darwin')
            .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/linux/x64/gifsicle', 'linux', 'x64')
            .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/win/x64/gifsicle.exe', 'win32', 'x64')
            .dest(path.join(__dirname, 'tmp'))
            .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

        bin.run(['--version'], function (err) {
            assert(!err);

            fs.exists(bin.path(), function (exists) {
                assert(exists);
                cb();
            });
        });
    });

    it('should meet the desired version', function (cb) {
        var bin = new Bin()
            .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/osx/gifsicle', 'darwin')
            .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/linux/x64/gifsicle', 'linux', 'x64')
            .src('https://github.com/imagemin/gifsicle-bin/raw/master/vendor/win/x64/gifsicle.exe', 'win32', 'x64')
            .dest(path.join(__dirname, 'tmp'))
            .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
            .version('>=1.71');

        bin.run(['--version'], function (err) {
            assert(!err);

            fs.exists(bin.path(), function (exists) {
                assert(exists);
                cb();
            });
        });
    });
});
