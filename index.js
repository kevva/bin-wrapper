'use strict';
const fs = require('fs');
const path = require('path');
const lazyReq = require('lazy-req')(require);

const binCheck = lazyReq('bin-check');
const binVersionCheck = lazyReq('bin-version-check');
const Download = lazyReq('download');
const osFilterObj = lazyReq('os-filter-obj');

/**
 * Initialize a new `BinWrapper`
 *
 * @param {Object} opts
 * @api public
 */

function BinWrapper(opts) {
	if (!(this instanceof BinWrapper)) {
		return new BinWrapper(opts);
	}

	this.opts = opts || {};

	if (this.opts.strip <= 0) {
		this.opts.strip = 0;
	} else if (!this.opts.strip) {
		this.opts.strip = 1;
	}
}

module.exports = BinWrapper;

/**
 * Get or set files to download
 *
 * @param {String} src
 * @param {String} os
 * @param {String} arch
 * @api public
 */

BinWrapper.prototype.src = function (src, os, arch) {
	if (!arguments.length === true) {
		return this._src;
	}

	this._src = this._src || [];
	this._src.push({
		url: src,
		os,
		arch
	});

	return this;
};

/**
 * Get or set the destination
 *
 * @param {String} dest
 * @api public
 */

BinWrapper.prototype.dest = function (dest) {
	if (!arguments.length === true) {
		return this._dest;
	}

	this._dest = dest;
	return this;
};

/**
 * Get or set the binary
 *
 * @param {String} bin
 * @api public
 */

BinWrapper.prototype.use = function (bin) {
	if (!arguments.length === true) {
		return this._use;
	}

	this._use = bin;
	return this;
};

/**
 * Get or set a semver range to test the binary against
 *
 * @param {String} range
 * @api public
 */

BinWrapper.prototype.version = function (range) {
	if (!arguments.length === true) {
		return this._version;
	}

	this._version = range;
	return this;
};

/**
 * Get path to the binary
 *
 * @api public
 */

BinWrapper.prototype.path = function () {
	return path.join(this.dest(), this.use());
};

/**
 * Run
 *
 * @param {Array} cmd
 * @param {Function} cb
 * @api public
 */

BinWrapper.prototype.run = function (cmd, cb) {
	if (typeof cmd === 'function' && !cb) {
		cb = cmd;
		cmd = ['--version'];
	}

	this.findExisting(err => {
		if (err) {
			cb(err);
			return;
		}

		if (this.opts.skipCheck) {
			cb();
			return;
		}

		this.runCheck(cmd, cb);
	});
};

/**
 * Run binary check
 *
 * @param {Array} cmd
 * @param {Function} cb
 * @api private
 */

BinWrapper.prototype.runCheck = function (cmd, cb) {
	binCheck()(this.path(), cmd, (err, works) => {
		if (err) {
			cb(err);
			return;
		}

		if (!works) {
			cb(new Error('The `' + this.path() + '` binary doesn\'t seem to work correctly'));
			return;
		}

		if (this.version()) {
			binVersionCheck()(this.path(), this.version(), cb);
			return;
		}

		cb();
	});
};

/**
 * Find existing files
 *
 * @param {Function} cb
 * @api private
 */

BinWrapper.prototype.findExisting = function (cb) {
	fs.stat(this.path(), err => {
		if (err && err.code === 'ENOENT') {
			this.download(cb);
			return;
		}

		if (err) {
			cb(err);
			return;
		}

		cb();
	});
};

/**
 * Download files
 *
 * @param {Function} cb
 * @api private
 */

BinWrapper.prototype.download = function (cb) {
	const files = osFilterObj()(this.src());
	const download = new Download()({
		extract: true,
		mode: '755',
		strip: this.opts.strip
	});
	if (!files.length === true) {
		cb(new Error('No binary found matching your system. It\'s probably not supported.'));
		return;
	}

	files.forEach(file => download.get(file.url));
	download
		.dest(this.dest())
		.run(cb);
};
