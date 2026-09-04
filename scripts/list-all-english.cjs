const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enMap = {};
[...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { enMap[m[1]] = m[2]; });

const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

for (const lang of locales) {
  const content = fs.readFileSync(`catalog/${lang}.ts`, 'utf8');
  const langMap = {};
  [...content.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { langMap[m[1]] = m[2]; });
  
  console.log(`\n=== ${lang}.ts ===`);
  let count = 0;
  for (const [key, enVal] of Object.entries(enMap)) {
    const langVal = langMap[key];
    if (langVal && /^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(langVal) && langVal.length > 3) {
      count++;
      console.log(`  "${key}": "${enVal}" => "${langVal}"`);
    }
  }
  console.log(`  TOTAL: ${count}`);
}
