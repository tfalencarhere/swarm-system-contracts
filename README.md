# swarm-system-contracts

System wide smart contracts for Swarm (postage stamps, oracles, etc.)


## Tests

This is a regular truffle project. You can either use `truffle test` (if installed) or `npm test` which will use a locally installed truffle.

```sh
npm install
npm test
```

To also generate coverage information use `npm run coverage` instead.

## Linting

This repo currently uses `solhint` as linter. It can be called through npm:
```sh
npm run solhint
```

## Overview

### Postage

This contract implements the `postage` function as described in [SWIP 8](https://github.com/ethersphere/SWIPs/blob/master/SWIPs/swip-8.md). 

### ProofOfBurn

This contract keeps track how much token every address sent into the contract through its `burn` function.