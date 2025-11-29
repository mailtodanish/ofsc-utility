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

## Function: getOAuthToken

Returns an OAuth token using OFSC client credentials.

### **Parameters**

  Name               Type     Description
  ------------------ -------- ----------------------------------------
  **clientId**       string   Your OFSC OAuth client ID
  **clientSecret**   string   Your OFSC OAuth client secret
  **instanceId**     string   Your OFSC OFSC instance/environment ID


