# Node.js Fundamentals

## What is Node.js?

Node.js is a JavaScript runtime environment that allows JavaScript to run outside of a web browser. It is commonly used to build servers, APIs, command-line tools, and backend applications.

## How does Node.js differ from running JavaScript in the browser?

JavaScript in the browser runs inside a web browser and can interact with web pages and the DOM. Node.js runs outside the browser and provides access to server-side features such as the file system, operating system information, and network operations.

## What is the V8 engine, and how does Node use it?

V8 is the JavaScript engine developed by Google. It compiles and executes JavaScript code. Node.js uses the V8 engine to run JavaScript outside of the browser.

## What are some key use cases for Node.js?

Some key use cases for Node.js include building web servers, REST APIs, real-time applications, command-line tools, automation scripts, and applications that work with files and databases.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS is the traditional module system used in Node.js. It uses `require()` to import modules and `module.exports` to export values.

```js
// CommonJS (default in Node.js)
const fs = require('fs');

module.exports = {
  readFile: fs.readFile
};
```

ES Modules are the modern JavaScript module system. They use `import` and `export` syntax.

```js
// ES Modules (supported in modern Node.js)
import fs from 'fs';

export const readFile = fs.readFile;
```
