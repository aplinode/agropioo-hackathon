const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const enEntries = [...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
const sdEntries = [...sd.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];

const sdMap = {};
sdEntries.forEach(m => { sdMap[m[1]] = m[2]; });

// Check: how many EN keys are present in SD?
let present = 0;
let missing = 0;
let englishLike = 0;
let arabic = 0;

for (const [key, engVal] of enEntries) {
  const sdVal = sdMap[key];
  if (sdVal === undefined) {
    missing++;
  } else {
    present++;
    if (/^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(sdVal)) {
      englishLike++;
    } else {
      arabic++;
    }
  }
}

console.log('EN entries:', enEntries.length);
console.log('SD entries:', sdEntries.length);
console.log('Present:', present, 'Missing:', missing);
console.log('English-like:', englishLike, 'Arabic/other:', arabic);

// Show some English-like values
let shown = 0;
for (const [key, engVal] of enEntries) {
  const sdVal = sdMap[key];
  if (sdVal !== undefined && /^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(sdVal)) {
    if (shown < 20) {
      console.log(`  ${key}: "${sdVal}"`);
      shown++;
    }
  }
}
