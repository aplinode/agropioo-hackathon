const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const files = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

const enKeys = [...en.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);
console.log('EN total keys:', enKeys.length);

for (const lang of files) {
  const content = fs.readFileSync(`catalog/${lang}.ts`, 'utf8');
  const entries = [...content.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
  const map = {};
  entries.forEach(m => { map[m[1]] = m[2]; });

  let translated = 0;
  let english = 0;
  let missing = 0;

  for (const k of enKeys) {
    const v = map[k];
    if (v === undefined) {
      missing++;
    } else if (/^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(v)) {
      english++;
    } else {
      translated++;
    }
  }

  console.log(`${lang}.ts: ${translated} translated, ${english} still English, ${missing} missing (total in file: ${entries.length})`);
}
