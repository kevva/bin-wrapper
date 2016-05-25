import fs from 'fs';
import path from 'path';
import nock from 'nock';
import pathExists from 'path-exists';
import pify from 'pify';
import rimraf from 'rimraf';
import test from 'ava';
import tempfile from 'tempfile';
import Fn from './';

const fsP = pify(fs);
const rimrafP = pify(rimraf);
const fixture = path.join.bind(path, __dirname, 'fixtures');

test.beforeEach(() => {
	nock('http://foo.com')
		.get('/gifsicle.tar.gz')
		.replyWithFile(200, fixture('gifsicle-' + process.platform + '.tar.gz'))
		.get('/gifsicle-darwin.tar.gz')
		.replyWithFile(200, fixture('gifsicle-darwin.tar.gz'))
		.get('/gifsicle-win32.tar.gz')
		.replyWithFile(200, fixture('gifsicle-win32.tar.gz'))
		.get('/test.js')
		.replyWithFile(200, __filename);
});

test('expose a constructor', t => {
	t.is(typeof Fn, 'function');
});

test('add a source', t => {
	const bin = new Fn().src('http://foo.com/bar.tar.gz');
	t.is(bin._src[0].url, 'http://foo.com/bar.tar.gz');
});

test('add a source to a specific os', t => {
	const bin = new Fn().src('http://foo.com', process.platform);
	t.is(bin._src[0].os, process.platform);
});

test('set destination directory', t => {
	const bin = new Fn().dest(path.join(__dirname, 'foo'));
	t.is(bin._dest, path.join(__dirname, 'foo'));
});

test('set which file to use as the binary', t => {
	const bin = new Fn().use('foo');
	t.is(bin._use, 'foo');
});

test('set a version range to test against', t => {
	const bin = new Fn().version('1.0.0');
	t.is(bin._version, '1.0.0');
});

test('get the binary path', t => {
	const bin = new Fn()
		.dest('tmp')
		.use('foo');

	t.is(bin.path(), path.join('tmp', 'foo'));
});

test('verify that a binary is working', async t => {
	const bin = new Fn()
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(tempfile())
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	await pify(bin.run.bind(bin))();
	t.true(await pathExists(bin.path()));
	await rimrafP(bin.dest());
});

test('meet the desired version', async t => {
	const bin = new Fn()
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(tempfile())
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
		.version('>=1.71');

	await pify(bin.run.bind(bin))();
	t.true(await pathExists(bin.path()));
	await rimrafP(bin.dest());
});

test('download files even if they are not used', async t => {
	const bin = new Fn({strip: 0, skipCheck: true})
		.src('http://foo.com/gifsicle-darwin.tar.gz')
		.src('http://foo.com/gifsicle-win32.tar.gz')
		.src('http://foo.com/test.js')
		.dest(tempfile())
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	await pify(bin.run.bind(bin))();
	const files = await fsP.readdirSync(bin.dest());

	t.is(files.length, 3);
	t.is(files[0], 'gifsicle');
	t.is(files[1], 'gifsicle.exe');
	t.is(files[2], 'test.js');

	await rimrafP(bin.dest());
});

test('skip running binary check', async t => {
	const bin = new Fn({skipCheck: true})
		.src('http://foo.com/gifsicle.tar.gz')
		.dest(tempfile())
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	await pify(bin.run.bind(bin))(['--shouldNotFailAnyway']);
	t.true(await pathExists(bin.path()));
	await rimrafP(bin.dest());
});

test('error if no binary is found and no source is provided', t => {
	const bin = new Fn()
		.dest(tempfile())
		.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle');

	t.throws(pify(bin.run.bind(bin))(), 'No binary found matching your system. It\'s probably not supported.');
});
