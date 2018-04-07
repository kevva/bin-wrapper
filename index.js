'use strict';
const fs = require('fs');
const path = require('path');
const importLazy = require('import-lazy')(require);

const binCheck = importLazy('bin-check');
const binVersionCheck = importLazy('bin-version-check');
const Download = importLazy('download');
const osFilterObj = importLazy('os-filter-obj');

/**
 * Initialize a new `BinWrapper`
 *
 * @param {Object} options
 * @api public
 */
module.exports = class BinWrapper {
	constructor(options = {}) {
		this.options = options;

		if (this.options.strip <= 0) {
			this.options.strip = 0;
		} else if (!this.options.strip) {
			this.options.strip = 1;
		}
	}

	/**
	 * Get or set files to download
	 *
	 * @param {String} src
	 * @param {String} os
	 * @param {String} arch
	 * @api public
	 */
	src(src, os, arch) {
		if (arguments.length === 0) {
			return this._src;
		}

		this._src = this._src || [];
		this._src.push({
			url: src,
			os,
			arch
		});

		return this;
	}

	/**
	 * Get or set the destination
	 *
	 * @param {String} dest
	 * @api public
	 */
	dest(dest) {
		if (arguments.length === 0) {
			return this._dest;
		}

		this._dest = dest;
		return this;
	}

	/**
	 * Get or set the binary
	 *
	 * @param {String} bin
	 * @api public
	 */
	use(bin) {
		if (arguments.length === 0) {
			return this._use;
		}

		this._use = bin;
		return this;
	}

	/**
	 * Get or set a semver range to test the binary against
	 *
	 * @param {String} range
	 * @api public
	 */
	version(range) {
		if (arguments.length === 0) {
			return this._version;
		}

		this._version = range;
		return this;
	}

	/**
	 * Get path to the binary
	 *
	 * @api public
	 */
	path() {
		return path.join(this.dest(), this.use());
	}

	/**
	 * Run
	 *
	 * @param {Array} cmd
	 * @param {Function} cb
	 * @api public
	 */
	run(cmd, cb) {
		if (typeof cmd === 'function' && !cb) {
			cb = cmd;
			cmd = ['--version'];
		}

		this.findExisting(err => {
			if (err) {
				cb(err);
				return;
			}

			if (this.options.skipCheck) {
				cb();
				return;
			}

			this.runCheck(cmd, cb);
		});
	}

	/**
	 * Run binary check
	 *
	 * @param {Array} cmd
	 * @param {Function} cb
	 * @api private
	 */
	runCheck(cmd, cb) {
		binCheck(this.path(), cmd)
			.then(works => {
				if (!works) {
					throw new Error(`The \`${this.path()}\` binary doesn't seem to work correctly`);
				}

				if (this.version()) {
					return binVersionCheck(this.path(), this.version());
				}

				return Promise.resolve();
			})
			.then(() => cb())
			.catch(err => cb(err));
	}

	/**
	 * Find existing files
	 *
	 * @param {Function} cb
	 * @api private
	 */
	findExisting(cb) {
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
	}

	/**
	 * Download files
	 *
	 * @param {Function} cb
	 * @api private
	 */
	download(cb) {
		const files = osFilterObj(this.src() || []);
		const download = new Download({
			extract: true,
			mode: '755',
			strip: this.options.strip
		});

		if (files.length === 0) {
			cb(new Error('No binary found matching your system. It\'s probably not supported.'));
			return;
		}

		files.forEach(file => download.get(file.url));

		download
			.dest(this.dest())
			.run(cb);
	}
};
