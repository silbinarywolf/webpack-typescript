# Webpack TypeScript

[![Build Status](https://travis-ci.org/silbinarywolf/webpack-typescript.svg?branch=master)](https://travis-ci.org/silbinarywolf/webpack-typescript)

## Why is `node_modules` a submodule?
I wanted to experiment with having all of the necessary dependencies alongside the repo. However node_modules is 100mb+ of data, so I wanted the dependencies to be managed seperately.

## Requirements

* Node v10.16.0+
* Yarn 1.17.3+

## Install

```
git clone https://github.com/silbinarywolf/webpack-typescript.git
cd webpack-typescript
git submodule init
git submodule update
```

## Run

**Run dev. server:**
```
yarn start
```

**Build distributable:**
```
yarn build
```

## Documentation

* [License](LICENSE.md)

## Credits

* [SEEK](https://github.com/seek-oss/css-modules-typescript-loader) for their Webpack plugin that generates TypeScript declaration files from CSS Modules.
* [Ryan Dahl](https://github.com/denoland/deno) for giving me the idea of having a back-up of node_modules held in a Git submodule
