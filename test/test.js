'use strict';

var Bin = require('../');
var fs = require('fs');
var nock = require('nock');
var path = require('path');
var fixture = path.join.bind(path, __dirname, 'fixtures');
var rm = require('rimraf');
var test = require('ava');

test('expose a constructor', function (t) {
	t.plan(1);
	t.assert(typeof Bin === 'function');
});

test('return an instance if it called without `new`', function (t) {
	t.plan(1);
	t.assert(Bin() instanceof Bin);
});

test('add a source', function (t) {
	t.plan(1);

	var bin = new Bin()
		.src('http://foo.com/bar.tar.gz');

	t.assert(bin._src[0].url === 'http://foo.com/bar.tar.gz');
});

test('add a source to a specific os', function (t) {
	t.plan(1);

	var bin = new Bin()
		.src('http://foo.com', process.platform);

	t.assert(bin._src[0].os === process.platform);
});

test('set destination directory', function (t) {
	t.plan(1);

	var bin = new Bin()
		.dest(path.join(__dirname, 'foo'));

	t.assert(bin._dest === path.join(__dirname, 'foo'));
});

test('set which file to use as the binary', function (t) {
	t.plan(1);

	var bin = new Bin()
		.use('foo');

	t.assert(bin._use === 'foo');
});

test('verify that a binary is working', function (t) {
	t.plan(3);

	nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'));

	var bin = new Bin()
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(path.join(__dirname, 'tmp1'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.exists(bin.path(), function (exists) {
			t.assert(exists);

			rm(path.join(__dirname, 'tmp1'), function (err) {
				t.assert(!err, err);
			});
		});
	});
});

test('meet the desired version', function (t) {
	t.plan(3);

	nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'));

	var bin = new Bin()
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(path.join(__dirname, 'tmp2'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
		.version('>=1.71');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.exists(bin.path(), function (exists) {
			t.assert(exists);

			rm(path.join(__dirname, 'tmp2'), function (err) {
				t.assert(!err, err);
			});
		});
	});
});

test('symlink a global binary', function (t) {
	t.plan(4);

	var bin = new Bin({ global: true })
		.dest(path.join(__dirname, 'tmp3'))
		.use('bash');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.lstat(bin.path(), function (err, stats) {
			t.assert(!err, err);
			t.assert(stats.isSymbolicLink());

			rm(path.join(__dirname, 'tmp3'), function (err) {
				t.assert(!err, err);
			});
		});
	});
});

test('skip running test command', function (t) {
	t.plan(3);

	nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'));

	var bin = new Bin({ skip: true })
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(path.join(__dirname, 'tmp4'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(['--shouldNotFailAnyway'], function (err) {
		t.assert(!err, err);

		fs.exists(bin.path(), function (exists) {
			t.assert(exists);

			rm(path.join(__dirname, 'tmp4'), function (err) {
				t.assert(!err, err);
			});
		});
	});
});

test('download files even if they are not used', function (t) {
	t.plan(7);

	nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-darwin.tar.gz'))
		.get('/gifsicle-win32.tar.gz')
		.replyWithFile(200, fixture('gifsicle-win32.tar.gz'))
		.get('/test.js')
		.replyWithFile(200, __filename);

	var bin = new Bin({ strip: 0, skip: true })
		.src('http://foo.com/gifsicle.tar.gz')
		.src('http://foo.com/gifsicle-win32.tar.gz')
		.src('http://foo.com/test.js')
		.dest(path.join(__dirname, 'tmp5'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.readdir(path.dirname(bin.path()), function (err, paths) {
			t.assert(!err, err);
			t.assert(paths.length === 3);
			t.assert(paths[0] === 'gifsicle');
			t.assert(paths[1] === 'gifsicle.exe');
			t.assert(paths[2] === 'test.js');

			rm(path.join(__dirname, 'tmp5'), function (err) {
				t.assert(!err, err);
			});
		});
	});
});

test('error if no binary is found and no source is provided', function (t) {
	t.plan(2);

	var bin = new Bin()
		.dest(path.join(__dirname, 'tmp6'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		t.assert(err);
		t.assert(err.message === 'No binary found matching your system. It\'s probably not supported.');
	});
});
