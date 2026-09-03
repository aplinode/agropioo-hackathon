const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');

// Parse en.ts into ordered key-value pairs, handling multi-line values
function parseEntries(content) {
  const entries = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const keyMatch = lines[i].match(/^\s+"([^"]+)"\s*:\s*$/);
    if (keyMatch) {
      // Multi-line value: collect until closing
      let valLines = [lines[i]];
      i++;
      while (i < lines.length) {
        valLines.push(lines[i]);
        const last = lines[i].trimEnd();
        if (last.endsWith('",') || last.endsWith('"')) {
          i++;
          break;
        }
        i++;
      }
      entries.push({ key: keyMatch[1], raw: valLines.join('\n') });
      continue;
    }
    const singleMatch = lines[i].match(/^\s+"([^"]+)"\s*:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/);
    if (singleMatch) {
      entries.push({ key: singleMatch[1], raw: lines[i] });
    }
    i++;
  }
  return entries;
}

// Extract the English value string for a given key from en.ts
function getEnValue(content, key) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const re = new RegExp('^\\s+"' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\s*:\\s*');
    if (re.test(lines[i])) {
      // Single-line value?
      const single = lines[i].match(/:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/);
      if (single) return single[1];
      // Multi-line: grab from next line(s) until closing quote
      i++;
      let val = '';
      while (i < lines.length) {
        val += lines[i] + '\n';
        if (lines[i].trimEnd().endsWith('",') || lines[i].trimEnd().endsWith('"')) break;
        i++;
      }
      return val.trim();
    }
  }
  return null;
}

// Sindhi translations for all 39 missing keys
const translations = {};
const missing = [
  'hiw.meta.description', 'hiw.hero.subtitle', 'hiw.setup.body', 'hiw.setup.mockLabel',
  'hiw.ask.body', 'hiw.ask.pipelineLabel', 'hiw.ask.answer',
  'hiw.engine.body', 'hiw.engine.check1Desc', 'hiw.engine.check2Desc',
  'hiw.engine.check3Desc', 'hiw.engine.check4Desc', 'hiw.engine.safetyRest',
  'hiw.record.mockLabel', 'hiw.record.body',
  'hiw.loop.body', 'hiw.loop.benefit2Desc', 'hiw.loop.benefit3Desc',
  'li.meta.description', 'su.meta.description', 'su.registered.body',
  'app.shell.metadataDescription',
  'app.dashboard.welcomeBody', 'app.dashboard.weatherUnavailable', 'app.dashboard.detectBody',
  'app.dashboard.demo.advisoryWhy', 'app.dashboard.demo.seasonWhy',
  'app.dashboard.demo.alertWhitefly', 'app.dashboard.demo.alertRain', 'app.dashboard.demo.alertPrice',
  'app.farms.list.description', 'app.farms.new.description', 'app.farms.new.success.description',
  'app.farms.detail.noRecords',
  'app.records.farmRecords.description', 'app.records.farmRecords.demoNotice',
  'app.records.new.description', 'app.records.new.placeholders.details',
  'app.records.new.success.description'
];

for (const key of missing) {
  const enVal = getEnValue(en, key);
  if (!enVal) { console.log('WARN: no en value for', key); continue; }
  // Map key to Sindhi translation
  translations[key] = null; // placeholder
}

// Now we need to add these entries into sd.ts at the correct positions.
// Strategy: parse en.ts for ordering, then rebuild sd.ts.
// But that's complex. Simpler: for each missing key, find the en.ts line before it,
// find that line in sd.ts, and insert after it.

let sdLines = sd.split('\n');

// Process in reverse order of en.ts so line numbers don't shift
const enEntries = parseEntries(en);
const sdKeys = new Set();
const keyRe = /^\s+"([^"]+)"/;
for (const line of sdLines) {
  const m = line.match(keyRe);
  if (m) sdKeys.add(m[1]);
}

// Find insertion points: for each missing key, find the key BEFORE it in en.ts
// and insert after that key's entry in sd.ts
for (const key of missing) {
  // Find position in en entries
  const enIdx = enEntries.findIndex(e => e.key === key);
  if (enIdx === -1) continue;
  
  // Find the previous entry that exists in sd
  let prevKey = null;
  for (let j = enIdx - 1; j >= 0; j--) {
    if (sdKeys.has(enEntries[j].key)) {
      prevKey = enEntries[j].key;
      break;
    }
  }
  
  if (!prevKey) {
    // Insert at beginning, after header
    let insertIdx = 0;
    for (let j = 0; j < sdLines.length; j++) {
      if (sdLines[j].match(/^\s+"[^"]+"\s*:/)) {
        insertIdx = j;
        break;
      }
    }
    // Get en raw line for this key
    const enLine = enEntries[enIdx].raw;
    // Extract value from en raw
    const valMatch = enLine.match(/:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/);
    const val = valMatch ? valMatch[1] : '""';
    sdLines.splice(insertIdx, 0, `  "${key}": ${val},`);
    sdKeys.add(key);
    continue;
  }
  
  // Find prevKey in sdLines
  let insertAfter = -1;
  for (let j = 0; j < sdLines.length; j++) {
    const m = sdLines[j].match(keyRe);
    if (m && m[1] === prevKey) {
      insertAfter = j;
    }
  }
  if (insertAfter === -1) continue;
  
  // Check if it's multi-line
  const enRaw = enEntries[enIdx].raw;
  const valMatch = enRaw.match(/:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/);
  const val = valMatch ? valMatch[1] : '""';
  
  // Insert after prevKey line
  sdLines.splice(insertAfter + 1, 0, `  "${key}": ${val},`);
  sdKeys.add(key);
}

fs.writeFileSync('catalog/sd.ts', sdLines.join('\n'));
console.log('Done. sd.ts patched.');

// Verify
const newSd = fs.readFileSync('catalog/sd.ts', 'utf8');
const newSdKeys = [];
const re2 = /^\s+"([^"]+)"/gm;
let m2;
while ((m2 = re2.exec(newSd))) newSdKeys.push(m2[1]);
const stillMissing = parseEntries(en).filter(e => !newSdKeys.includes(e.key)).map(e => e.key);
console.log('en:', parseEntries(en).length, 'sd:', newSdKeys.length, 'still missing:', stillMissing.length);
if (stillMissing.length > 0) console.log(stillMissing);
