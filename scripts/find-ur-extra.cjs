const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');

const extract = (content) => {
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
};

const enKeys = extract(en);
const urKeys = extract(ur);

const extra = urKeys.filter(k => !enKeys.includes(k));
console.log('Extra in ur.ts:', extra.length);
extra.forEach(k => console.log('  ' + k));
