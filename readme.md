# bin-wrapper [![Build Status](https://travis-ci.org/kevva/bin-wrapper.svg?branch=master)](https://travis-ci.org/kevva/bin-wrapper)

> Binary wrapper that makes your programs seamlessly available as local dependencies


## Install

```
$ npm install bin-wrapper
```


## Usage

```js
const BinWrapper = require('bin-wrapper');

const base = 'https://github.com/imagemin/gifsicle-bin/raw/master/vendor';
const bin = new BinWrapper()
	.src(`${base}/macos/gifsicle`, 'darwin')
	.src(`${base}/linux/x64/gifsicle`, 'linux', 'x64')
	.src(`${base}/win/x64/gifsicle.exe`, 'win32', 'x64')
	.dest(path.join('vendor'))
	.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
	.version('>=1.71');

(async () => {
	await bin.run(['--version']);
	console.log('gifsicle is working');
})();
```

Get the path to your binary with `bin.path()`:

```js
console.log(bin.path());
//=> 'path/to/vendor/gifsicle'
```


## API

### `new BinWrapper(options)`

Creates a new `BinWrapper` instance.

#### options

Type: `Object`

##### skipCheck

Type: `boolean`<br>
Default: `false`

Whether to skip the binary check or not.

##### strip

Type: `number`<br>
Default: `1`

Strip a number of leading paths from file names on extraction.

### .baseUrl(baseUrl)

Accepts a base URL that is prepended to everything added as a src using [.src](#.src(url, [os], [arch])).

#### baseUrl

Type: `string`

Accepts a URL pointing to use as the base URL.

#### Usage

```js
const BinWrapper = require('bin-wrapper');

const bin = new BinWrapper()
	.baseUrl('https://github.com/imagemin/gifsicle-bin/raw/master/vendor')
	.src(`/linux/x64/gifsicle`, 'linux', 'x64')
	.dest(path.join('vendor'))
	.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
```

### .baseUrlOverrideEnvName(envName)

 Accepts an enviroment variable name to look for. When set the value of this enviroment varibale overrides the value set using [.baseUrl](#.baseUrl(baseUrl)).

#### envName

Type: `string`

Accepts a enviroment variable name.

#### Usage

The below will download the binary from `http://example.com/private/mirror/linux/x64/gifsicle`

```sh
export GIFSICLE_BIN__MIRROR="http://example.com/private/mirror
```

```js
const BinWrapper = require('bin-wrapper');

const bin = new BinWrapper()
	.baseUrl('https://github.com/imagemin/gifsicle-bin/raw/master/vendor')
	.baseUrlOverrideEnvName('GIFSICLE_BIN__MIRROR')
	.src(`/linux/x64/gifsicle`, 'linux', 'x64')
	.dest(path.join('vendor'))
	.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')
```

### .src(url, [os], [arch])

Adds a source to download.

#### url

Type: `string`

Accepts a URL pointing to a file to download.

#### os

Type: `string`

Tie the source to a specific OS.

#### arch

Type: `string`

Tie the source to a specific arch.

### .dest(destination)

#### destination

Type: `string`

Accepts a path which the files will be downloaded to.

### .use(binary)

#### binary

Type: `string`

Define which file to use as the binary.

### .path()

Returns the full path to your binary.

### .version(range)

#### range

Type: `string`

Define a [semver range](https://github.com/isaacs/node-semver#ranges) to check
the binary against.

### .run([arguments])

Runs the search for the binary. If no binary is found it will download the file
using the URL provided in `.src()`.

#### arguments

Type: `Array`<br>
Default: `['--version']`

Command to run the binary with. If it exits with code `0` it means that the
binary is working.


## License

MIT © [Kevin Mårtensson](http://kevinmartensson.com)
