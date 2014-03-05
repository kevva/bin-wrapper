/* global afterEach, beforeEach, describe, it */
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

    beforeEach(function () {
        this.bin = new Bin({ bin: 'gifsicle', dest: 'tmp' });
    });

    it('should add a path', function (cb) {
        var dest = path.join(__dirname, 'vendor');
        var src = [this.bin.dest, dest];
        this.bin.addPath(dest);
        cb(assert.equal(this.bin.paths.toString(), src));
    });

    it('should add a source', function (cb) {
        var dest = 'http://this.is/a/nice/url';
        this.bin.addSource(dest);
        cb(assert.equal(this.bin.src, dest));
    });

    it('should return destination path', function (cb) {
        var dest = path.join(this.bin.dest, this.bin.bin);
        cb(assert.equal(this.bin.path, dest));
    });

    it('should download and test a binary and emit working', function (cb) {
        this.bin
            .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/linux/x64/gifsicle', 'linux', 'x64')
            .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/osx/gifsicle', 'darwin')
            .check()
            .on('success', function () {
                cb(assert(true));
            });
    });

    it('should download two files and test a binary and emit working', function (cb) {
        this.bin
            .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/linux/x64/gifsicle', 'linux', 'x64')
            .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/osx/gifsicle', 'darwin')
            .addFile('https://raw.github.com/yeoman/node-jpegtran-bin/master/vendor/win/x64/libjpeg-62.dll')
            .check()
            .on('success', function () {
                assert(true);
                assert(fs.existsSync('tmp/libjpeg-62.dll'), true);
                assert(fs.existsSync('tmp/gifsicle'), true);
                cb(assert(true));
            });
    });

    it('should download and test a binary and emit fail', function (cb) {
        this.bin
            .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/linux/x64/gifsicle', 'darwin')
            .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/osx/gifsicle', 'linux', 'x64')
            .check()
            .on('fail', function () {
                cb(assert(true));
            });
    });

    it('should download and and build source code', function (cb) {
        var url = 'http://www.lcdf.org/gifsicle/gifsicle-1.71.tar.gz';
        var script = './configure --disable-gifview --disable-gifdiff ' +
                     '--prefix="' + path.join(__dirname, this.bin.dest) + '" ' +
                     '--bindir="' + path.join(__dirname, this.bin.dest) + '" && ' +
                     'make install';

        this.bin
            .addSource(url)
            .build(script)
            .on('finish', function () {
                cb(assert(true));
            });
    });
});
