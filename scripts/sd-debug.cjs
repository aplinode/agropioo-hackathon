const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const enKeys = [...en.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);
const sdKeys = [...sd.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);

console.log('EN keys:', enKeys.length);
console.log('SD keys:', sdKeys.length);

// Check first few keys
for (let i = 0; i < 5; i++) {
  console.log(`EN[${i}]: "${enKeys[i]}" (len=${enKeys[i].length})`);
  console.log(`SD[${i}]: "${sdKeys[i]}" (len=${sdKeys[i].length})`);
  console.log(`  equal: ${enKeys[i] === sdKeys[i]}`);
}

// Check mismatches
const enSet = new Set(enKeys);
const sdSet = new Set(sdKeys);
const inEnNotSd = enKeys.filter(k => !sdSet.has(k));
const inSdNotEn = sdKeys.filter(k => !enSet.has(k));
console.log('\nIn EN but not SD:', inEnNotSd.length);
console.log('In SD but not EN:', inSdNotEn.length);
if (inEnNotSd.length > 0) console.log('  Examples:', inEnNotSd.slice(0, 5));
if (inSdNotEn.length > 0) console.log('  Examples:', inSdNotEn.slice(0, 5));
