const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const enMap = {};
[...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { enMap[m[1]] = m[2]; });
const sdMap = {};
[...sd.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { sdMap[m[1]] = m[2]; });

let englishLike = 0;
const examples = [];

for (const [key, enVal] of Object.entries(enMap)) {
  const sdVal = sdMap[key];
  if (!sdVal) continue;
  if (/^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(sdVal)) {
    englishLike++;
    if (examples.length < 30) {
      examples.push({ key, en: enVal, sd: sdVal });
    }
  }
}

console.log('English-like values:', englishLike);
console.log('\nExamples:');
for (const e of examples) {
  console.log(`  ${e.key}`);
  console.log(`    EN: "${e.en}"`);
  console.log(`    SD: "${e.sd}"`);
}
