/*global afterEach, describe, it */
'use strict';

var assert = require('assert');
var Bin = require('./');
var fs = require('fs');
var path = require('path');
var rm = require('rimraf');

var opts = {
    name: 'gifsicle',
    bin: 'gifsicle',
    path: path.join(__dirname, 'tmp'),
    src: 'http://www.lcdf.org/gifsicle/gifsicle-1.71.tar.gz',
    buildScript: './configure --disable-gifview --disable-gifdiff --bindir="' + path.join(__dirname, '../tmp') +
                 '" && make install',
    platform: {
        darwin: {
            url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/osx/gifsicle'
        },
        linux: {
            url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/linux/x86/gifsicle',
            arch: {
                x64: {
                    url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/linux/x64/gifsicle',
                }
            }
        },
        freebsd: {
            url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/freebsd/x86/gifsicle',
            arch: {
                x64: {
                    url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/freebsd/x64/gifsicle',
                }
            }
        },
        win32: {
            bin: 'gifsicle.exe',
            url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/win/x86/gifsicle.exe',
            arch: {
                x64: {
                    url: 'https://raw.github.com/yeoman/node-gifsicle/master/vendor/win/x64/gifsicle.exe',
                }
            }
        }
    }
};
var bin = new Bin(opts);

afterEach(function () {
    rm.sync(path.join(__dirname, 'tmp'));
});

describe('BinWrapper.check()', function () {
    it('should download and verify a binary', function (cb) {
        bin.check(function (w) {
            cb(assert.equal(w, true));
        });
    });
});

describe('BinWrapper.build()', function () {
    it('should download source and build binary', function (cb) {
        bin.path = path.join(__dirname, 'tmp/gifsicle');
        bin.buildScript = './configure --disable-gifview --disable-gifdiff ' +
                          '--prefix="' + path.join(__dirname, 'tmp/gifsicle') + '" ' +
                          '--bindir="' + path.join(__dirname, 'tmp/gifsicle') + '" && ' +
                          'make install';

        bin.build(function () {
            cb(assert.ok(fs.existsSync(bin.path)));
        });
    });
});
