# bin-wrapper [![Build Status](https://secure.travis-ci.org/kevva/bin-wrapper.png?branch=master)](http://travis-ci.org/kevva/bin-wrapper)

## Getting started

Install with [npm](https://npmjs.org/package/bin-wrapper): `npm install bin-wrapper`

## Examples

All `platform` and `arch` specific options takes precedence over the base 
options. See [test.js](test.js) for a full fleshed example.

```js
var Bin = require('bin-wrapper');

var opts = {
    name: 'Gifsicle',
    bin: 'gifsicle',
    path: __dirname + '/vendor',
    url: 'http://url/to/gifsicle',
    platform: {
        win32: {
            bin: 'gifsicle.exe',
            url: [
                'http://url/to/gifsicle.exe'
                'http://url/to/gifsicle.dll'
            ]
        }
    }
}

var bin = new Bin(opts)

bin.check('--version', function (works) {
    if (works) {
        console.log('Binary downloaded and passed the test!')
    }
});
```

Get the path to your binary with `bin.path`.

```js
console.log(bin.path);
// => path/to/vendor/gifsicle
```

## API

### .check(cmd, cb)

Check if a binary is present and working. If it isn't, download and test it by 
running the binary with `cmd` and see if it exits correctly.

### .build(cb)

Download the source archive defined in the `src` property and build it using the 
build script defined in the `buildScript` property.

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License) (c) [Kevin Mårtensson](http://kevinmartensson.com)
