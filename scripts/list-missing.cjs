const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enEntries = [...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
const enMap = {};
enEntries.forEach(m => { enMap[m[1]] = m[2]; });

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const urEntries = [...ur.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
const urMap = {};
urEntries.forEach(m => { urMap[m[1]] = m[2]; });

const enKeys = Object.keys(enMap);

const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

for (const lang of locales) {
  const content = fs.readFileSync(`catalog/${lang}.ts`, 'utf8');
  const langEntries = [...content.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
  const langMap = {};
  langEntries.forEach(m => { langMap[m[1]] = m[2]; });
  
  const missing = enKeys.filter(k => !langMap[k]);
  console.log(`\n=== ${lang}.ts: ${missing.length} missing ===`);
  missing.forEach(k => {
    const urVal = urMap[k] || enMap[k];
    console.log(`  "${k}": "${urVal.substring(0, 80)}${urVal.length > 80 ? '...' : ''}"`);
  });
}
