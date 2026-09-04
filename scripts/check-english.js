const fs = require('fs');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const lines = sd.split('\n');
const eng = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (!l.includes(':')) continue;
  const m = l.match(/"([^"]+)":\s*"([^"]+)"/);
  if (!m) continue;
  const key = m[1], val = m[2];
  if (/^[A-Za-z\s\u2014\u2019',.\-:;!?()\/%0-9\u00b7]+$/.test(val) && val.length > 5 &&
      !key.includes('meta.') && !key.includes('pageTitle') && !key.includes('heading')) {
    eng.push((i + 1) + ': ' + key + ' = ' + val.substring(0, 80));
  }
}
console.log('English values found: ' + eng.length);
eng.forEach(e => console.log(e));
