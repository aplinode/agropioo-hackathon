const fs = require('fs');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const m = [...sd.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
console.log('matched entries:', m.length);
if (m.length > 0) {
  console.log('first:', m[0][1]);
  console.log('last:', m[m.length - 1][1]);
}
