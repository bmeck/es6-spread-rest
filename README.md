# es6-spread-rest

rest arguments, array spread, and argument spread compiled to ES5.

## Command line

If installing via npm a command line tool will be available called es6-spread-rest.

```
$ echo "console.log(...[1,...[2,3]])" | es6-spread-rest
```

```
$ es6-spread-rest $file
```

## Browserify

Browserify support is built in.

```
$ npm install es6-spread-rest  # install local dependency
$ browserify -t es6-spread-rest $file
```
