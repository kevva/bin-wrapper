/* global afterEach, beforeEach, describe, it */
'use strict';

var assert = require('assert');
var Bin = require('./');
var path = require('path');
var rm = require('rimraf');

describe('BinWrapper()', function () {
    afterEach(function (cb) {
        rm(path.join(__dirname, 'tmp'), cb);
    });

    beforeEach(function () {
        this.bin = new Bin({ dest: 'tmp' });
    });

    it('should add a path', function (cb) {
        var dest = path.join(__dirname, 'vendor');
        var src = [this.bin.dest, dest];
        this.bin.addPath(dest);
        cb(assert.equal(this.bin.paths.toString(), src));
    });

    it('should add a URL', function (cb) {
        var dest = 'http://this.is/a/nice/url';
        this.bin.addUrl(dest);
        cb(assert.equal(this.bin.url, dest));
    });

    it('should add a source', function (cb) {
        var dest = 'http://this.is/a/nice/url';
        this.bin.addSource(dest);
        cb(assert.equal(this.bin.src, dest));
    });

    it('should download and test a binary and emit working', function (cb) {
        var url = 'https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/linux/x64/gifsicle';

        if (process.platform === 'darwin') {
            url = 'https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/osx/gifsicle';
        }

        this.bin
            .addUrl(url)
            .check('gifsicle')
            .on('working', function () {
                cb(assert(true));
            });
    });

    it('should download and test a binary and emit fail', function (cb) {
        var url = 'https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/osx/gifsicle';

        if (process.platform === 'darwin') {
            url = 'https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/linux/x64/gifsicle';
        }

        this.bin
            .addUrl(url)
            .check('gifsicle')
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
            .on('build', function () {
                cb(assert(true));
            });
    });
});
