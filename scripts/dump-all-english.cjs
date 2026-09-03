const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enMap = {};
[...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { enMap[m[1]] = m[2]; });

for (const lang of ['sd', 'ps', 'pa', 'bal', 'skr', 'hno']) {
  const content = fs.readFileSync(`catalog/${lang}.ts`, 'utf8');
  const langMap = {};
  [...content.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { langMap[m[1]] = m[2]; });
  
  let count = 0;
  let output = '';
  for (const [key, enVal] of Object.entries(enMap)) {
    const langVal = langMap[key];
    if (langVal && /^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(langVal) && langVal.length > 2) {
      count++;
      output += `"${key}": "${enVal}" => "${langVal}"\n`;
    }
  }
  
  fs.writeFileSync(`scripts/english-${lang}.txt`, output);
  console.log(`${lang}: ${count} English values -> scripts/english-${lang}.txt`);
}
