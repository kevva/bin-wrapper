'use strict';

var binCheck = require('bin-check');
var binVersionCheck = require('bin-version-check');
var find = require('find-file');
var path = require('path');

/**
 * Initialize a new `BinWrapper`
 *
 * @api public
 */

function BinWrapper() {
    this._src = [];
}

/**
 * Add a file to download
 *
 * @param {String} src
 * @param {String} os
 * @param {String} arch
 * @api public
 */

BinWrapper.prototype.src = function (src, os, arch) {
    if (!arguments.length) {
        return this._src;
    }

    var obj = { url: src, name: path.basename(src) };

    if (os) {
        obj.os = os;
    }

    if (arch) {
        obj.arch = arch;
    }

    this._src = this._src.concat(obj);
    return this;
};

/**
 * Define where to download the file to
 *
 * @param {String} dest
 * @api public
 */

BinWrapper.prototype.dest = function (dest) {
    if (!arguments.length) {
        return this._dest;
    }

    this._dest = dest;
    return this;
};

/**
 * Define which file to use as a binary
 *
 * @param {String} bin
 * @api public
 */

BinWrapper.prototype.use = function (bin) {
    if (!arguments.length) {
        return this._use;
    }

    this._use = bin;
    return this;
};

/**
 * Get the bin path
 *
 * @api public
 */

BinWrapper.prototype.path = function () {
    var opts = { path: this.dest(), global: this.global, exclude: 'node_modules/.bin' };
    var bin = find(this.use(), opts);
    var dir;

    if (bin && bin.length > 0) {
        dir = bin[0];
    } else {
        dir = path.join(this.dest(), this.use());
    }

    return dir;
};

/**
 * Define a semver range to test the binary against
 *
 * @param {String} range
 * @api public
 */

BinWrapper.prototype.version = function (range) {
    if (!arguments.length) {
        return this._version;
    }

    this._version = range;
    return this;
};

/**
 * Run bin-wrapper
 *
 * @param {Array} cmd
 * @param {Function} cb
 * @api public
 */

BinWrapper.prototype.run = function (cmd, cb) {
    var Download = require('download');
    var files = this._parse(this.src());
    var self = this;

    this._test(cmd, function (err) {
        if (err) {
            var download = new Download({ mode: 777 });

            files.forEach(function (file) {
                download.get(file, self.dest());
            });

            return download.run(function (err) {
                if (err) {
                    return cb(err);
                }

                self._test(cmd, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    cb();
                });
            });
        }

        cb();
    });
};

/**
 * Test binary
 *
 * @param {Array} cmd
 * @param {Function} cb
 * @api private
 */

BinWrapper.prototype._test = function (cmd, cb) {
    var self = this;

    if (this.path()) {
        return binCheck(self.path(), cmd, function (err, works) {
            if (err) {
                return cb(err);
            }

            if (!works) {
                return cb(new Error('The `' + self.use() + '` binary doesn\'t seem to work correctly.'));
            }

            if (self.version()) {
                return binVersionCheck(self.path(), self.version(), function (err) {
                    if (err) {
                        return cb(err);
                    }

                    cb();
                });
            }

            cb();
        });
    }

    cb(new Error('Couldn\'t find the `' + this.use() + '` binary. Make sure it\'s installed and in your $PATH.'));
};

/**
 * Parse
 *
 * @param {Object} obj
 * @api private
 */

BinWrapper.prototype._parse = function (obj) {
    var arch = process.arch === 'x64' ? 'x64' : process.arch === 'arm' ? 'arm' : 'x86';
    var ret = [];

    obj.filter(function (o) {
        if (o.os && o.os === process.platform && o.arch && o.arch === arch) {
            return ret.push(o);
        } else if (o.os && o.os === process.platform && !o.arch) {
            return ret.push(o);
        } else if (!o.os && !o.arch) {
            return ret.push(o);
        }
    });

    return ret;
};

/**
 * Module exports
 */

module.exports = BinWrapper;
