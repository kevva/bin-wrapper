'use strict';
const path = require('path');
const binCheck = require('bin-check');
const binVersionCheck = require('bin-version-check');
const chalk = require('chalk');
const Conf = require('conf');
const download = require('download');
const Listr = require('listr');
const pIf = require('p-if');
const tempfile = require('tempfile');
const whichExcludeNpm = require('which-exclude-npm');

const config = new Conf();

const findExisting = bin => (ctx, task) => Promise.resolve(config.get(bin))
	.then(pIf(Boolean, res => res, () => whichExcludeNpm(bin)))
	.then(file => {
		task.title = `Found existing binary at ${file}`;
		ctx.path = file;
	});

const testBin = cmd => (ctx, task) => binCheck(ctx.path, cmd)
	.then(works => {
		if (!works) {
			throw new Error('Binary doesn\'t seem to work');
		}

		task.title = `${ctx.path} passed the test`;
	})
	.catch(err => {
		ctx.path = null;
		throw err;
	});

const testBinVersion = version => (ctx, task) => binVersionCheck(ctx.path, version)
	.then(() => {
		task.title = `${ctx.path} satisfies the desired version`;
	})
	.catch(err => {
		ctx.path = null;
		throw err;
	});

const downloadBin = (bin, opts) => (ctx, task) => download(opts.url, opts.dest, opts).then(() => {
	const dest = path.join(opts.dest, bin);
	task.title = `Files downloaded to ${opts.dest}`;
	ctx.path = dest;
});

module.exports = (bin, opts) => {
	opts = Object.assign({
		extract: true,
		dest: tempfile(),
		filename: bin,
		runTest: true,
		strip: 1
	}, opts);

	const tasks = new Listr([{
		title: `Searching for existing ${bin} binary…`,
		task: findExisting(bin)
	}, {
		title: `Testing existing ${bin} binary…`,
		enabled: ctx => opts.runTest && ctx.path,
		task: testBin(opts.testCommand)
	}, {
		title: `Checking existing ${bin} version…`,
		enabled: ctx => opts.version && ctx.path,
		task: testBinVersion(opts.version)
	}, {
		title: `Downloading files…`,
		enabled: ctx => opts.url && !ctx.path,
		task: downloadBin(bin, opts)
	}, {
		title: `Testing downloaded ${bin} binary…`,
		enabled: ctx => opts.runTest && ctx.path,
		task: testBin(opts.testCommand)
	}, {
		title: `Checking downloaded ${bin} version…`,
		enabled: ctx => opts.version && ctx.path,
		task: testBinVersion(opts.version)
	}], {
		exitOnError: false
	});

	return tasks.run()
		.then(ctx => {
			config.set(bin, ctx.path);
		})
		.catch(err => {
			if (err.context.path) {
				config.set(bin, err.context.path);
				return;
			}

			throw err;
		});
};

module.exports.path = bin => config.get(bin);

module.exports.BinError = class extends Error {
	constructor(err) {
		if (err.code === 'ENOENT') {
			err.message = `${chalk.red(`${err.path} doesn't exist. Try downloading it manually.`)}\n\n${err.message}`;
		}

		super(err.message);

		this.name = 'BinError';
	}
};
