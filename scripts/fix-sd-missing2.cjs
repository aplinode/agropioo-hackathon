const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const extract = (content) => {
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
};

const enKeys = extract(en);
const sdKeys = extract(sd);
const missing = enKeys.filter(k => !sdKeys.includes(k));

console.log('Missing:', missing);

if (missing.length > 0) {
  const lines = sd.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length - 2; i++) {
    newLines.push(lines[i]);
  }
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
  newLines.push('};');
  newLines.push('');
  newLines.push('export type CatalogKey = keyof typeof sd;');
  newLines.push('');
  fs.writeFileSync('catalog/sd.ts', newLines.join('\n'));
  console.log('Fixed sd.ts');
}
