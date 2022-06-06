import {promises as fs} from 'node:fs';
import path from 'node:path';
import binCheck from 'bin-check';
import binVersionCheck from 'bin-version-check';
import download from 'download';
import osFilterObject from 'os-filter-obj';

/**
 * Initialize a new `BinWrapper`
 *
 * @param {Object} options
 * @api public
 */
export default class BinWrapper {
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
			arch,
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
	 * @api public
	 */
	run(cmd = ['--version']) {
		return this.findExisting().then(() => {
			if (this.options.skipCheck) {
				return;
			}

			return this.runCheck(cmd);
		});
	}

	/**
	 * Run binary check
	 *
	 * @param {Array} cmd
	 * @api private
	 */
	runCheck(cmd) {
		return binCheck(this.path(), cmd).then(works => {
			if (!works) {
				throw new Error(`The \`${this.path()}\` binary doesn't seem to work correctly`);
			}

			if (this.version()) {
				return binVersionCheck(this.path(), this.version());
			}
		});
	}

	/**
	 * Find existing files
	 *
	 * @api private
	 */
	findExisting() {
		return fs.stat(this.path()).catch(error => {
			if (error && error.code === 'ENOENT') {
				return this.download();
			}

			throw error;
		});
	}

	/**
	 * Download files
	 *
	 * @api private
	 */
	download() {
		const files = osFilterObject(this.src() || []);

		if (files.length === 0) {
			return Promise.reject(new Error('No binary found matching your system. It\'s probably not supported.'));
		}

		const urls = [];
		for (const file of files) {
			urls.push(file.url);
		}

		return Promise.all(urls.map(url => download(url, this.dest(), {
			extract: true,
			strip: this.options.strip,
		}))).then(result => {
			const resultingFiles = result.flatMap((item, index) => {
				if (Array.isArray(item)) {
					return item.map(file => file.path);
				}

				const parsedUrl = new URL(files[index].url);
				const parsedPath = path.parse(parsedUrl.pathname);

				return parsedPath.base;
			});

			return Promise.all(resultingFiles.map(fileName => fs.chmod(path.join(this.dest(), fileName), 0o755)));
		});
	}
}
