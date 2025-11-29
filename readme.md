# Enhanced ofsc utility

A lightweight utility library for interacting with **Oracle Field Service Cloud (OFSC)**.

## Features

- 🚀 **40+ utility methods** 
- 📚 **Written in TypeScript** with full type definitions
- 🧪 **Completely tested** with Jest
- 📦 **Zero dependencies**
- 🎯 **Modular architecture** for tree-shaking
- 🔧 **Multiple import styles** for flexibility

## Installation

``` bash
npm install ofsc-utility
```

## Functions implemented

### Download
    downloadWorkZoneCSV(clientId, clientSecret, instanceId)
    getOAuthToken(clientId, clientSecret, instanceId)

## Usage

### CommonJS

``` js
const ofs = require('ofsc-utility');

ofs.getOAuthToken("clientId", "clientSecret", "instanceId")
  .then((token) => {
      console.log(token);
  })
  .catch((err) => {
      console.error("Error fetching token:", err);
  });
```


``` js
const ofs = require('ofsc-utility');

ofs.WorkZone.downloadWorkZoneCSV("clientId", "clientSecret", "instanceId").then((token) => {
    console.log(token);
});
```

## License

MIT


