const fs = require('fs');
const c = fs.readFileSync('catalog/sd.ts', 'utf8');
const keys = [];
for (const line of c.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) keys.push(m[1]);
}
console.log('sd.ts keys:', keys.length);
const hasImport = c.includes('import type');
console.log('Has import type:', hasImport);
const backticks = (c.match(/`/g) || []).length;
console.log('Backtick chars:', backticks);
