// FILE: frontend/jest.polyfills.js
// jest.polyfills.js
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
