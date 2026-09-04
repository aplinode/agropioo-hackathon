const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const extract = (c) => { const k=[]; for(const l of c.split('\n')){const m=l.match(/"([^"]+)"\s*:/);if(m)k.push(m[1])} return k; };
const enKeys = extract(en);
const sdKeys = extract(sd);
const missing = enKeys.filter(k => !sdKeys.includes(k));
console.log('Missing:', missing);

const sdLines = sd.split('\n');
let closingIdx = -1;
for (let i = sdLines.length - 1; i >= 0; i--) {
  if (sdLines[i].trim() === '};') { closingIdx = i; break; }
}

const before = sdLines.slice(0, closingIdx);
const newKeys = [];
for (const key of missing) {
  const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
  if (enLine) {
    const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) {
      const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      newKeys.push('  "' + key + '": "' + escaped + '",');
    }
  }
}

const result = [...before, ...newKeys, '};', '', 'export type CatalogKey = keyof typeof sd;', ''].join('\n');
fs.writeFileSync('catalog/sd.ts', result);
console.log('Fixed sd.ts');
