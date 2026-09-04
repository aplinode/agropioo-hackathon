const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enKeys = [];
for (const line of en.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) enKeys.push(m[1]);
}
console.log('en.ts keys:', enKeys.length);

// Fix skr.ts - find missing keys and add them from en.ts
const skr = fs.readFileSync('catalog/skr.ts', 'utf8');
const skrKeys = [];
for (const line of skr.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) skrKeys.push(m[1]);
}

const missing = enKeys.filter(k => !skrKeys.includes(k));
console.log('Missing from skr.ts:', missing.length);

if (missing.length > 0) {
  // Add missing keys before closing };
  let content = skr;
  for (const key of missing) {
    const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
    if (enLine) {
      const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
      if (m) {
        const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        content = content.replace(/\n};\s*$/, '\n  "' + key + '": "' + escaped + '",\n};\n');
      }
    }
  }
  fs.writeFileSync('catalog/skr.ts', content);
  console.log('Added missing keys to skr.ts');
}
