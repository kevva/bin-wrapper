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
        var bin = new Bin({ version: '1.80' })
            .src('https://raw.github.com/yeoman/node-gifsicle/0.1.5/vendor/osx/gifsicle', 'darwin')
            .src('https://raw.github.com/yeoman/node-gifsicle/0.1.5/vendor/linux/x64/gifsicle', 'linux', 'x64')
            .dest(path.join(__dirname, 'tmp'))
            .use('gifsicle');

        bin.run(['--version'], function (err) {
            assert(!err);

            fs.exists(bin.use(), function (exists) {
                assert(exists);
                cb();
            });
        });
    });
});
