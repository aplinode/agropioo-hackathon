const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enKeys = [];
for (const line of en.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) enKeys.push(m[1]);
}

const locales = ['ur', 'ps', 'sd', 'pa', 'bal', 'skr', 'hno'];

for (const code of locales) {
  const filePath = 'catalog/' + code + '.ts';
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = [];
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:/);
    if (m) keys.push(m[1]);
  }
  const missing = enKeys.filter(k => !keys.includes(k));
  if (missing.length > 0) {
    console.log(code + ': ' + missing.length + ' missing');
    let newContent = content;
    for (const key of missing) {
      const enLine = en.split('\n').find(l => l.includes('"' + key + '"'));
      if (enLine) {
        const m = enLine.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
        if (m) {
          const escaped = m[2].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          newContent = newContent.replace(/\n};\s*$/, '\n  "' + key + '": "' + escaped + '",\n};\n');
        }
      }
    }
    fs.writeFileSync(filePath, newContent);
    console.log('  Fixed ' + code);
  }
}
console.log('Done');
