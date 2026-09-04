const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const pa = fs.readFileSync('catalog/pa.ts', 'utf8');

const extract = (content) => {
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
};

const enKeys = extract(en);
const paKeys = extract(pa);

const missing = enKeys.filter(k => !paKeys.includes(k));
console.log('Missing from pa.ts:', missing.length);
missing.forEach(k => console.log('  ' + k));
