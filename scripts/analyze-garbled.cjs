// Analyze which keys need fixing per locale
const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enKeys = [...en.matchAll(/"([^"]+)"\s*:/g)].map(m => m[1]);

const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

for (const loc of locales) {
  const content = fs.readFileSync(`catalog/${loc}.ts`, 'utf8');
  // Find all key-value pairs
  const entries = [...content.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
  const map = {};
  entries.forEach(m => { map[m[1]] = m[2]; });
  
  // Keys present in this file
  const present = enKeys.filter(k => map[k] !== undefined);
  const missing = enKeys.filter(k => map[k] === undefined);
  
  // Of present keys, which have garbled text (contain box-drawing chars or non-Arabic, non-ASCII patterns)
  const garbled = present.filter(k => {
    const v = map[k];
    // Check for box-drawing characters (╪, ┘, ┌, ─, ╫, etc) = mojibake
    if (/[\u2500-\u257f\u2580-\u259f\u25a0-\u25ff]/.test(v)) return true;
    // Check for replacement character
    if (v.includes('\uFFFD')) return true;
    return false;
  });
  
  // Of present keys, which are still English
  const english = present.filter(k => {
    const v = map[k];
    if (garbled.includes(k)) return false;
    if (/^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|{}]+$/i.test(v) && v.length > 3) return true;
    return false;
  });
  
  const good = present.filter(k => !garbled.includes(k) && !english.includes(k));
  
  console.log(`\n=== ${loc}.ts ===`);
  console.log(`  Present: ${present.length}, Missing: ${missing.length}`);
  console.log(`  Good translations: ${good.length}`);
  console.log(`  Garbled (mojibake): ${garbled.length}`);
  console.log(`  Still English: ${english.length}`);
  
  if (garbled.length > 0) {
    console.log(`  Garbled keys sample: ${garbled.slice(0, 5).join(', ')}`);
  }
}
