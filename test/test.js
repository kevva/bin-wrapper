'use strict';

var fs = require('fs');
var path = require('path');
var BinWrapper = require('../');
var nock = require('nock');
var rimraf = require('rimraf');
var test = require('ava');
var fixture = path.join.bind(path, __dirname, 'fixtures');

test('expose a constructor', function (t) {
	t.plan(1);
	t.assert(typeof BinWrapper === 'function');
});

test('return an instance if it called without `new`', function (t) {
	t.plan(1);
	t.assert(BinWrapper() instanceof BinWrapper);
});

test('add a source', function (t) {
	t.plan(1);

	var bin = new BinWrapper()
		.src('http://foo.com/bar.tar.gz');

	t.assert(bin._src[0].url === 'http://foo.com/bar.tar.gz', bin._src[0].url);
});

test('add a source to a specific os', function (t) {
	t.plan(1);

	var bin = new BinWrapper()
		.src('http://foo.com', process.platform);

	t.assert(bin._src[0].os === process.platform, bin._src[0].os);
});

test('set destination directory', function (t) {
	t.plan(1);

	var bin = new BinWrapper()
		.dest(path.join(__dirname, 'foo'));

	t.assert(bin._dest === path.join(__dirname, 'foo'), bin._dest);
});

test('set which file to use as the binary', function (t) {
	t.plan(1);

	var bin = new BinWrapper()
		.use('foo');

	t.assert(bin._use === 'foo', bin._use);
});

test('set a version range to test against', function (t) {
	t.plan(1);

	var bin = new BinWrapper()
		.version('1.0.0');

	t.assert(bin._version === '1.0.0', bin._version);
});

test('get the binary path', function (t) {
	t.plan(1);

	var bin = new BinWrapper()
		.dest('tmp')
		.use('foo');

	t.assert(bin.path() === 'tmp/foo', bin.path());
});

test('verify that a binary is working', function (t) {
	t.plan(4);

	var scope = nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'));

	var bin = new BinWrapper()
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(path.join(__dirname, 't0'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		t.assert(!err, err);
		t.assert(fs.existsSync(bin.path()));
		t.assert(scope.isDone());

		rimraf(bin.dest(), function (err) {
			t.assert(!err, err);
		});
	});
});

test('meet the desired version', function (t) {
	t.plan(4);

	var scope = nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'));

	var bin = new BinWrapper()
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(path.join(__dirname, 't1'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
		.version('>=1.71');

	bin.run(function (err) {
		t.assert(!err, err);
		t.assert(fs.existsSync(bin.path()));
		t.assert(scope.isDone());

		rimraf(bin.dest(), function (err) {
			t.assert(!err, err);
		});
	});
});

test('download files even if they are not used', function (t) {
	t.plan(7);

	var scope = nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-darwin.tar.gz'))
		.get('/gifsicle-win32.tar.gz')
		.replyWithFile(200, fixture('gifsicle-win32.tar.gz'))
		.get('/test.js')
		.replyWithFile(200, __filename);

	var bin = new BinWrapper({strip: 0, skipCheck: true})
		.src('http://foo.com/gifsicle.tar.gz')
		.src('http://foo.com/gifsicle-win32.tar.gz')
		.src('http://foo.com/test.js')
		.dest(path.join(__dirname, 't2'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		var files = fs.readdirSync(bin.dest());

		t.assert(!err, err);
		t.assert(scope.isDone());
		t.assert(files.length === 3);
		t.assert(files[0] === 'gifsicle', files[0]);
		t.assert(files[1] === 'gifsicle.exe', files[1]);
		t.assert(files[2] === 'test.js', files[2]);

		rimraf(bin.dest(), function (err) {
			t.assert(!err, err);
		});
	});
});

test('skip running binary check', function (t) {
	t.plan(4);

	var scope = nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'));

	var bin = new BinWrapper({skipCheck: true})
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(path.join(__dirname, 't3'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(['--shouldNotFailAnyway'], function (err) {
		t.assert(!err, err);
		t.assert(fs.existsSync(bin.path()));
		t.assert(scope.isDone());

		rimraf(bin.dest(), function (err) {
			t.assert(!err, err);
		});
	});
});

test('error if no binary is found and no source is provided', function (t) {
	t.plan(2);

	var bin = new BinWrapper()
		.dest(path.join(__dirname, 't4'))
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	bin.run(function (err) {
		t.assert(err, err);
		t.assert(err.message === 'No binary found matching your system. It\'s probably not supported.', err.message);
	});
});
