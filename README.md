# bin-wrapper [![Build Status](https://secure.travis-ci.org/kevva/bin-wrapper.png?branch=master)](http://travis-ci.org/kevva/bin-wrapper)

Binary wrapper for Node.js that makes your programs seamlessly available as local dependencies

## Getting started

Install with [npm](https://npmjs.org/package/bin-wrapper): `npm install bin-wrapper`

## Examples

```js
var BinWrapper = require('bin-wrapper');
var bin = new BinWrapper({ bin: 'gifsicle', dest: 'vendor' });

bin
    .addUrl('https://raw.github.com/yeoman/node-gifsicle/0.1.4/vendor/osx/gifsicle')
    .addSource('http://www.lcdf.org/gifsicle/gifsicle-1.71.tar.gz')
    .check()
    .on('working', function () {
        console.log('gifsicle is working');
    })
    .on('fail', function () {
        this.build('./configure && make && make install')
            .on('build', function () {
                console.log('gifsicle rebuilt successfully!')
            })
            .on('error', function (err) {
                console.log(err);
            });
    })
    .on('error', function (err) {
        console.log(err);
    });
```

Get the path to your binary with `bin.path`.

```js
console.log(bin.path);
// => path/to/vendor/gifsicle
```

## API

### new BinWrapper(opts)

Creates a new `BinWrapper`. Available options are `bin` which is the name of the 
binary and `dest` which is where to download the binary to.

### .check(cmd)

Check if a binary is present and working. If it isn't, download and test it by 
running the binary with `cmd` and see if it exits correctly.

### .build(cmd)

Download the source archive defined in the `src` property and build it using the 
build script defined in the `cmd` argument.

### .addPath(src)

Add a path where to check for the binary. By default `dest` is added to paths.

### .addUrl(url, platform ,arch)

Add a URL to download the binary from. Use `platform` and `arch` to target a 
specific system.

### .addSource(url)

Add a URL where to download the source code from.

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License) (c) [Kevin Mårtensson](http://kevinmartensson.com)
