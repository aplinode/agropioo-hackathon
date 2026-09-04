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
const missing = enKeys.filter(k => !psKeys.includes(k));

console.log('Missing:', missing.length);

// Insert missing keys before the last line (export line)
const lines = ps.split('\n');
const lastLine = lines[lines.length - 1];
const secondLast = lines[lines.length - 2]; // should be };
const thirdLast = lines[lines.length - 3]; // should be last key or empty

// Build new lines
const newLines = [];
for (let i = 0; i < lines.length - 2; i++) {
  newLines.push(lines[i]);
}

// Add missing keys
for (const key of missing) {
  const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
  if (enLine) {
    const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) {
      const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      newLines.push('  "' + key + '": "' + escaped + '",');
    }
  }
}

// Add closing and export
newLines.push('};');
newLines.push('');
newLines.push('export type CatalogKey = keyof typeof ps;');
newLines.push('');

fs.writeFileSync('catalog/ps.ts', newLines.join('\n'));
console.log('Written ps.ts with', newLines.length, 'lines');
