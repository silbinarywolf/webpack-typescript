# DataGal

[![Actions Status](https://github.com/silbinarywolf/webpack-typescript/workflows/Node%20CI/badge.svg)](https://github.com/silbinarywolf/webpack-typescript/actions)
[![Build Status](https://travis-ci.org/silbinarywolf/webpack-typescript.svg?branch=master)](https://travis-ci.org/silbinarywolf/webpack-typescript)

A single-binary locally-hosted web server to manage data that you can define the structure of with JSON files. This tool can be used to manage a database similar to RPG Maker's Database Editor or OGMO Editors Project settings.

## Development Requirements

* Node v10.16.0+ or v12.12.0+
* Yarn 1.15.0+
* Go 1.12+

## Install

```
git clone https://github.com/silbinarywolf/webpack-typescript.git
cd webpack-typescript
git submodule init
git submodule update
yarn install --offline
```

## Run

**Build and run server application:**
```
yarn server
```

**Run client application in watch mode:**
```
yarn start
```

**Build client distributables:**
```
yarn build
```

## Documentation

* [License](LICENSE.md)
* [Contributing](CONTRIBUTING.md)

## Credits

* [SEEK](https://github.com/seek-oss/css-modules-typescript-loader) for their Webpack plugin that generates TypeScript declaration files from CSS Modules.
* [Ryan Dahl](https://github.com/denoland/deno) for giving me the idea of having a back-up of node_modules held in a Git submodule
