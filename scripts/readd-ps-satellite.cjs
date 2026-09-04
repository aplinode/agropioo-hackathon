const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const ps = fs.readFileSync('catalog/ps.ts', 'utf8');

const extract = (c) => { const k=[]; for(const l of c.split('\n')){const m=l.match(/"([^"]+)"\s*:/);if(m)k.push(m[1])} return k; };
const enKeys = extract(en);
const psKeys = extract(ps);
const missing = enKeys.filter(k => !psKeys.includes(k));
console.log('Missing:', missing.length);

// Find closing }; line
const psLines = ps.split('\n');
let closingIdx = -1;
for (let i = psLines.length - 1; i >= 0; i--) {
  if (psLines[i].trim() === '};') { closingIdx = i; break; }
}

// Build new file
const before = psLines.slice(0, closingIdx);
const after = psLines.slice(closingIdx);

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

const result = [...before, ...newKeys, ...after, ''].join('\n');
fs.writeFileSync('catalog/ps.ts', result);
console.log('Written ps.ts, missing now:', enKeys.filter(k => !extract(result).includes(k)).length);
