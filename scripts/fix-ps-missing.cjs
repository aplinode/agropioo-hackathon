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
console.log('Missing from ps.ts:', missing);

for (const key of missing) {
  const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
  if (enLine) {
    const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) {
      const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      // Add before closing };
      let content = fs.readFileSync('catalog/ps.ts', 'utf8');
      content = content.replace(/\n};\s*$/, '\n  "' + key + '": "' + escaped + '",\n};\n');
      fs.writeFileSync('catalog/ps.ts', content);
      console.log('Added: ' + key);
    }
  }
}
