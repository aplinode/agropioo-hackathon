const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

function extractKeys(content) {
  const keys = [];
  const re = /^\s+"([^"]+)":/gm;
  let m;
  while ((m = re.exec(content))) {
    keys.push(m[1]);
  }
  return keys;
}

const enKeys = extractKeys(en);
const sdKeys = extractKeys(sd);
const missing = enKeys.filter(k => !sdKeys.includes(k));

console.log('en keys:', enKeys.length, 'sd keys:', sdKeys.length, 'missing:', missing.length);
missing.forEach(k => console.log(' -', k));
