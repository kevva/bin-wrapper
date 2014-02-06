'use strict';

var download = require('download');
var events = require('events');
var exec = require('child_process').exec;
var executable = require('executable');
var findFile = require('find-file');
var path = require('path');
var ProgressBar = require('progress');
var rm = require('rimraf');
var spawn = require('child_process').spawn;
var tempfile = require('tempfile');
var util = require('util');

/**
 * Initialize BinWrapper with options
 *
 * @param {Object} opts
 * @api public
 */

function BinWrapper(opts) {
    events.EventEmitter.call(this);
    opts = opts || {};
    this.dest = opts.dest || process.cwd();
    this.paths = [this.dest];
}

/**
 * Inherit from `events.EventEmitter`
 */

util.inherits(BinWrapper, events.EventEmitter);

/**
 * Check if a binary is present and working
 *
 * @param {String} bin
 * @param {String|Array} cmd
 * @api public
 */

BinWrapper.prototype.check = function (bin, cmd) {
    var self = this;
    var global = this._find(bin);
    var dl = this._download(this.url, this.dest, {
        mode: '0755'
    });

    cmd = cmd || ['--help'];
    cmd = Array.isArray(cmd) ? cmd : [cmd];

    if (global) {
        return self._test(global, cmd);
    }

    dl.on('close', function () {
        return self._test(path.join(self.dest, bin), cmd);
    });

    return this;
};

/**
 * Download source and build a binary
 *
 * @param {String|Array} cmd
 * @api public
 */

BinWrapper.prototype.build = function (cmd) {
    var self = this;
    var tmp = tempfile();
    var dl = this._download(this.src, tmp, {
        mode: '0777',
        extract: true,
        strip: 1
    });

    dl.on('close', function () {
        exec(cmd, { cwd: tmp }, function (err) {
            if (err) {
                self.emit('error', err);
            }

            rm(tmp, function () {
                self.emit('build');
            });
        });
    });

    return this;
};

/**
 * Add a path or an array of paths to check
 *
 * @param {String} src
 * @param {String} platform
 * @param {String} arch
 * @api public
 */

BinWrapper.prototype.addPath = function (src, platform, arch) {
    this.paths.push(src);
    return this;
};

/**
 * Add a URL to download
 *
 * @param {String} url
 * @param {String} platform
 * @param {String} arch
 * @api public
 */

BinWrapper.prototype.addUrl = function (url, platform, arch) {
    this.url = url;
    return this;
};

/**
 * Add a URL to source code
 *
 * @param {String} url
 * @api public
 */

BinWrapper.prototype.addSource = function (url) {
    this.src = url;
    return this;
};

/**
 * Find binary and check if it's executable
 *
 * @param {String} bin
 * @api private
 */

BinWrapper.prototype._find = function (bin) {
    var file = findFile(bin, this.paths, 'node_modules/.bin');

    if (file) {
        if (executable.sync(file[0])) {
            return file[0];
        }
    }

    return false;
};

/**
 * Check if a binary is working by checking its exit code
 *
 * @param {String} bin
 * @param {Array} cmd
 * @api private
 */

BinWrapper.prototype._test = function (bin, cmd) {
    var cp = spawn(bin, cmd);
    var self = this;

    cp.on('error', function (err) {
        self.emit('error', err);
    });

    cp.on('exit', function (code) {
        self.emit(code === 0 ? 'working' : 'fail');
    });

    return this;
};

/**
 * Download with progress bars
 *
 * @param {String} url
 * @param {String} dest
 * @param {Object} opts
 * @api private
 */

BinWrapper.prototype._download = function (url, dest, opts) {
    var dl = download(url, dest, opts);

    dl.on('response', function (res) {
        var len = parseInt(res.headers['content-length'], 10);
        var bar = new ProgressBar('  ' + path.basename(url) + ': downloading [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: len
        });

        res.on('data', function (data) {
            bar.tick(data.length);
        });

        res.on('end', function () {
            console.log('\n');
        });
    });

    return dl;
};

/**
 * Module exports
 */

module.exports = BinWrapper;
