const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const ps = fs.readFileSync('catalog/ps.ts', 'utf8');

const extract = (content) => {
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
};

const enKeys = extract(en);
const psKeys = extract(ps);

console.log('en.ts keys:', enKeys.length);
console.log('ps.ts keys:', psKeys.length);

const missing = enKeys.filter(k => !psKeys.includes(k));
console.log('Missing from ps.ts:', missing.length);
if (missing.length > 0) {
  missing.slice(0, 10).forEach(k => console.log('  ' + k));
  if (missing.length > 10) console.log('  ... and ' + (missing.length - 10) + ' more');
}

const extra = psKeys.filter(k => !enKeys.includes(k));
console.log('Extra in ps.ts:', extra.length);
if (extra.length > 0) {
  extra.slice(0, 10).forEach(k => console.log('  ' + k));
}
