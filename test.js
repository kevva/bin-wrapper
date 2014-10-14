'use strict';

var Bin = require('./');
var fs = require('fs');
var path = require('path');
var test = require('ava');

test('expose a constructor', function (t) {
	t.plan(1);
	t.assert(typeof Bin === 'function');
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
	t.plan(2);

	var base = 'https://github.com/imagemin/gifsicle-bin/raw/master/vendor';
	var bin = new Bin()
		.src(base + '/osx/gifsicle', 'darwin')
		.src(base + '/linux/x64/gifsicle', 'linux', 'x64')
		.src(base + '/win/x64/gifsicle.exe', 'win32', 'x64')
		.dest(path.join(__dirname, 'tmp'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.exists(bin.path(), function (exists) {
			t.assert(exists);
		});
	});
});

test('download and extract an archive', function (t) {
	t.plan(2);

	var base = 'https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-1.9.7';
	var bin = new Bin({ strip: 1 })
		.src(base + '-macosx.zip', 'darwin')
		.src(base + '-windows.zip', 'win32')
		.src(base + '-linux-x86_64.tar.bz2', 'linux', 'x64')
		.src(base + '-linux-i686.tar.bz2', 'linux', 'x86')
		.dest(path.join(__dirname, 'tmp'))
		.use(process.platform === 'win32' ? 'phantomjs.exe' : 'bin/phantomjs');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.exists(bin.path(), function (exists) {
			t.assert(exists);
		});
	});
});

test('meet the desired version', function (t) {
	t.plan(2);

	var base = 'https://github.com/imagemin/gifsicle-bin/raw/master/vendor';
	var bin = new Bin()
		.src(base + '/osx/gifsicle', 'darwin')
		.src(base + '/linux/x64/gifsicle', 'linux', 'x64')
		.src(base + '/win/x64/gifsicle.exe', 'win32', 'x64')
		.dest(path.join(__dirname, 'tmp'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
		.version('>=1.71');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.exists(bin.path(), function (exists) {
			t.assert(exists);
		});
	});
});

test('symlink a global binary', function (t) {
	t.plan(3);

	var bin = new Bin({ global: true })
		.dest(path.join(__dirname, 'tmp'))
		.use('bash');

	bin.run(function (err) {
		t.assert(!err, err);

		fs.lstat(bin.path(), function (err, stats) {
			t.assert(!err, err);
			t.assert(stats.isSymbolicLink());
		});
	});
});
