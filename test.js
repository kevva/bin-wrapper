import path from 'path';
import test from 'ava';
import Conf from 'conf';
import nock from 'nock';
import m from '.';

const config = new Conf();
const gifsicle = process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle';
const fixture = path.join.bind(path, __dirname, 'fixtures');

const gifsicleFail = {
	darwin: 'gifsicle',
	linux: 'gifsicle.exe',
	win32: 'gifsicle'
}[process.platform];

const urlFail = {
	darwin: 'gifsicle-linux.tar.gz',
	linux: 'gifsicle-win32.tar.gz',
	win32: 'gifsicle-darwin.tar.gz'
}[process.platform];

test.beforeEach(() => {
	config.clear();

	nock('http://foo.com')
		.get('/gifsicle')
		.replyWithFile(200, fixture(`gifsicle-${process.platform}.tar.gz`))
		.get('/gifsicle-wrong')
		.replyWithFile(200, fixture(urlFail));
});

test('find globally installed binary', async t => {
	await t.notThrows(m('bash'));
	t.truthy(m.path('bash'));
});

test('download and extract binary', async t => {
	await t.notThrows(m(gifsicle, {url: 'http://foo.com/gifsicle'}));
	t.truthy(m.path(gifsicle));
});

test('check if binary satisfies the desired version', async t => {
	await t.notThrows(m(gifsicle, {
		url: 'http://foo.com/gifsicle',
		version: '>=1.71'
	}));

	t.truthy(m.path(gifsicle));
});

test('skip tests', async t => {
	await t.notThrows(m(gifsicleFail, {
		runTest: false,
		url: 'http://foo.com/gifsicle-wrong'
	}));

	t.truthy(m.path(gifsicleFail));
});
