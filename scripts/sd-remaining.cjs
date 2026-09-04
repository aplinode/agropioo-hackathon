const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const enMap = {};
[...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { enMap[m[1]] = m[2]; });
const sdMap = {};
[...sd.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)].forEach(m => { sdMap[m[1]] = m[2]; });

console.log('sd.ts remaining English values:');
let count = 0;
for (const [key, enVal] of Object.entries(enMap)) {
  const sdVal = sdMap[key];
  if (sdVal && /^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(sdVal) && sdVal.length > 3) {
    count++;
    if (count <= 50) {
      console.log(`  ${key}`);
      console.log(`    EN: "${enVal}"`);
      console.log(`    SD: "${sdVal}"`);
    }
  }
}
console.log(`Total: ${count}`);
