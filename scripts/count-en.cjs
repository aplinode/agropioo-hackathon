const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const keys = [];
for (const line of en.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) keys.push(m[1]);
}
console.log('en.ts keys:', keys.length);
