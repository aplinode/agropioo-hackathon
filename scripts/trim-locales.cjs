const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enKeys = [];
for (const line of en.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) enKeys.push(m[1]);
}
console.log('en.ts keys:', enKeys.length);

const locales = ['ur', 'ps', 'sd', 'pa', 'bal', 'skr', 'hno'];

for (const code of locales) {
  const filePath = 'catalog/' + code + '.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse all key-value pairs
  const map = {};
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) map[m[1]] = m[2];
  }

  // Find what's in en.ts but not in locale
  const missing = enKeys.filter(k => !(k in map));
  console.log(code + ': has ' + Object.keys(map).length + ' keys, missing ' + missing.length);

  // Rebuild: only keep keys that are in en.ts
  const lines = content.split('\n');
  const newLines = [];
  let insertedMissing = false;

  for (const line of lines) {
    const m = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) {
      const key = m[1];
      // Only keep if in en.ts
      if (enKeys.includes(key)) {
        newLines.push(line);
      }
      // Track if we've passed the last key
    } else {
      newLines.push(line);
    }
  }

  // Now add missing keys before the closing };
  let result = newLines.join('\n');

  for (const key of missing) {
    const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
    if (enLine) {
      // Use English value as fallback (will need translation later)
      const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
      if (m) {
        const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        result = result.replace(/\n};\s*$/, '\n  "' + key + '": "' + escaped + '",\n};\n');
      }
    }
  }

  fs.writeFileSync(filePath, result);
  console.log('  Written ' + filePath);
}

console.log('Done!');
