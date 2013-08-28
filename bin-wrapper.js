'use strict';

var download = require('download');
var each = require('async-foreach').forEach;
var fs = require('fs');
var mout = require('mout');
var path = require('path');
var spawn = require('child_process').spawn;

/**
 * Initialize BinWrapper with opts
 *
 * @param {Object} opts
 * @api public
 */

function BinWrapper(opts) {
    opts = opts || {};
    this.opts = this._parse(opts);
    this.name = this.opts.name;
    this.bin = this.opts.bin;
    this.dest = this.opts.path;
    this.path = path.join(this.dest, this.bin);
    this.url = this.opts.url;
    this.source = this.opts.source;
}

/**
 * Check if a binary is present and working
 *
 * @param {String|Array} cmd
 * @param {Function} cb
 * @api public
 */

BinWrapper.prototype.check = function (cmd, cb) {
    if (!cb && mout.lang.isFunction(cmd)) {
        cb = cmd;
        cmd = ['--help'];
    }

    cmd = cmd;
    cmd = Array.isArray(cmd) ? cmd : [cmd];

    var self = this;
    var get = this._download(this.url, this.dest, function () {
        return self._test(cmd, cb);
    });

    if (fs.existsSync(this.path)) {
        return self._test(cmd, cb);
    }

    return get;
};

/**
 * Test if a binary returns the expected output which is
 * the binary name
 *
 * @param {Array} cmd
 * @param {Function} cb
 */

BinWrapper.prototype._test = function (cmd, cb) {
    var self = this;
    var working;
    var bin = spawn(this.path, cmd);

    var test = bin.stdout.on('data', function (data) {
        data = new Buffer(data).toString().toLowerCase();
        working = data.indexOf(self.name) !== -1 ? true : false;
    });

    test.on('close', function () {
        return cb(working);
    });

    return test;
};

/**
 * Download an array files
 *
 * @param {String|Array} url
 * @param {String} dest
 * @param {Function} cb
 * @api private
 */

BinWrapper.prototype._download = function (url, dest, cb) {
    url = Array.isArray(url) ? url : [url];

    each(url, function (val) {
        dest = path.join(dest, path.basename(val));

        var done = this.async();
        var get = download(val, dest);

        get.on('close', function () {
            fs.chmodSync(dest, '0755');
            done();
        });
    }, cb);
};

/**
 * Parse options
 *
 * @param {Object} opts
 * @api private
 */

BinWrapper.prototype._parse = function (opts) {
    opts.platform = opts.platform || {};
    opts.arch = opts.arch || {};

    var platform = process.platform;
    var arch = process.arch === 'x64' ? 'x64' : 'x86';
    var required = [
        'bin',
        'name',
        'path',
        'url'
    ];

    if (mout.object.hasOwn(opts.platform, [platform])) {
        opts = mout.object.mixIn(opts, opts.platform[platform]);
    }

    if (mout.object.hasOwn(opts.arch, [arch])) {
        opts = mout.object.mixIn(opts, opts.arch[arch]);
    }

    required.forEach(function (val) {
        if (!mout.object.hasOwn(opts, val)) {
            throw new Error('A valid ' + val + ' is required');
        }
    });

    delete opts.platform;
    delete opts.arch;

    return opts;
};

/**
 * Module exports
 */

module.exports = BinWrapper;
