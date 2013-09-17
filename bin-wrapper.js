'use strict';

var download = require('download');
var exec = require('child_process').exec;
var fs = require('fs');
var isbin = require('isbin');
var mout = require('mout');
var os = require('os');
var path = require('path');
var spawn = require('child_process').spawn;
var which = require('which');

/**
 * Initialize BinWrapper with options
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
    this.build = this.opts.build;
}

/**
 * Check if a binary is present and working
 *
 * @param {String|Array} cmd
 * @param {Function} cb
 * @api public
 */

BinWrapper.prototype.check = function (cmd, cb) {
    var self = this;

    if (!cb && mout.lang.isFunction(cmd)) {
        cb = cmd;
        cmd = ['--help'];
    }

    cmd = cmd;
    cmd = Array.isArray(cmd) ? cmd : [cmd];

    if (fs.existsSync(this.path)) {
        return self._test(cmd, cb);
    }

    if (isbin(this.bin)) {
        self.path = which.sync(self.bin);
        return self._test(cmd, cb);
    }

    this._download(this.url, this.dest, function () {
        return self._test(cmd, cb);
    });
};

BinWrapper.prototype.build = function () {
    var tmpDir = os.tmpdir ? os.tmpdir() : os.tmpDir();
    var tmp = path.join(tmpDir, this.name);
    var get = download(this.source, tmpDir, { extract: true, strip: 1 });

    get.on('end', function () {
        exec(this.build, { cwd: tmp });
    });
};

/**
 * Test if a binary is working by checking its exit code
 *
 * @param {Array} cmd
 * @param {Function} cb
 * @api private
 */

BinWrapper.prototype._test = function (cmd, cb) {
    var working;
    var bin = spawn(this.path, cmd);

    bin.on('error', function () {
        working = false;
        return cb(working);
    });

    bin.on('exit', function (code) {
        working = code === 0 ? true : false;
        return cb(working);
    });

    return bin;
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
    var get = download(url, dest);
    var file = path.join(dest, path.basename(url));

    get.on('close', function () {
        fs.chmod(file, '0755', cb);
    });
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
            throw new Error(val + ' option is required');
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
