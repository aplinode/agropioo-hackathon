const fs = require('fs');
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const urKeys = [...ur.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);
const enKeys = [...en.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);
console.log('ur keys:', urKeys.length);
console.log('en keys:', enKeys.length);
const missing = enKeys.filter(k => !urKeys.includes(k));
console.log('missing from ur:', missing.length);
if (missing.length > 0) {
  missing.forEach(k => console.log('  ', k));
}
