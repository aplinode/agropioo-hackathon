const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');

const extract = (content) => {
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*"([^"]+)"\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
};

const enKeys = extract(en);
const urKeys = extract(ur);

console.log('en keys:', enKeys.length);
console.log('ur keys:', urKeys.length);

const missing = enKeys.filter(k => !urKeys.includes(k));
console.log('Missing from ur:', missing.length);
missing.forEach(k => {
  const enLine = en.split('\n').find(l => l.includes('"' + k + '"'));
  console.log(k, '→', enLine ? enLine.trim().substring(0, 80) : 'NOT FOUND');
});
