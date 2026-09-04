const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enKeys = [];
for (const line of en.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) enKeys.push(m[1]);
}

const ps = fs.readFileSync('catalog/ps.ts', 'utf8');
const psKeys = [];
for (const line of ps.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) psKeys.push(m[1]);
}

const missing = enKeys.filter(k => !psKeys.includes(k));
console.log('Missing from ps.ts:', missing.length);

// Find the closing }; before export
const exportLine = 'export type CatalogKey = keyof typeof ps;';
const exportIdx = ps.indexOf(exportLine);
const beforeExport = ps.substring(0, exportIdx);
const closingIdx = beforeExport.lastIndexOf('};');

// Build new content
const lines = [];
for (let i = 0; i < closingIdx; i++) {
  lines.push(ps.split('\n')[i]);
}

// Add missing keys
for (const key of missing) {
  const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
  if (enLine) {
    const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) {
      const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      lines.push('  "' + key + '": "' + escaped + '",');
    }
  }
}

lines.push('};');
lines.push('');
lines.push(exportLine);
lines.push('');

fs.writeFileSync('catalog/ps.ts', lines.join('\n'));
console.log('Written ps.ts with', lines.length, 'lines');
