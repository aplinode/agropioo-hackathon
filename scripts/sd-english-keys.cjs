const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const enEntries = [...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
const sdEntries = [...sd.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];

const sdMap = {};
sdEntries.forEach(m => { sdMap[m[1]] = m[2]; });

const needsTranslation = [];
for (const [key, engVal] of enEntries) {
  const sdVal = sdMap[key];
  if (!sdVal) continue;
  // Check if value is English (only ASCII letters/spaces/punctuation)
  if (/^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(sdVal) && sdVal.length > 2) {
    needsTranslation.push({ key, eng: engVal, current: sdVal });
  }
}

console.log(`Keys needing Sindhi translation: ${needsTranslation.length}`);
console.log(JSON.stringify(needsTranslation, null, 2));
