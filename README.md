# es6-spread-rest

## Command line

If installing via npm a command line tool will be available called es6-arrow-function.

```
$ echo "console.log(...[1,...[2,3]])" | es6-arrow-function
```

```
$ es6-arrow-function $file
```

## Browserify

Browserify support is built in.

```
$ npm install es6-arrow-function  # install local dependency
$ browserify -t es6-arrow-function $file
```