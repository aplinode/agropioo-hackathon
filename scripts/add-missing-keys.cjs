const fs = require('fs');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');

// Extract all entries from en.ts and ur.ts
const extractEntries = (content) => {
  const entries = {};
  // Match "key": "value" patterns, handling multiline values
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s+"([^"]+)"\s*:\s*"(.*)"(,?)\s*$/);
    if (match) {
      entries[match[1]] = match[2];
    }
  }
  return entries;
};

const enMap = extractEntries(en);
const urMap = extractEntries(ur);

const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

for (const lang of locales) {
  const content = fs.readFileSync(`catalog/${lang}.ts`, 'utf8');
  const langMap = extractEntries(content);
  
  const missing = Object.keys(enMap).filter(k => !langMap[k]);
  
  if (missing.length === 0) {
    console.log(`${lang}.ts: no missing keys`);
    continue;
  }
  
  console.log(`${lang}.ts: ${missing.length} missing keys`);
  
  // Find the last line of the object (before closing brace)
  const lines = content.split('\n');
  let lastEntryIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^\s+"[^"]+"\s*:\s*"/)) {
      lastEntryIndex = i;
      break;
    }
  }
  
  if (lastEntryIndex === -1) {
    console.log(`  ERROR: Could not find last entry`);
    continue;
  }
  
  // Add missing entries after the last entry
  const newLines = [];
  for (const key of missing) {
    const urVal = urMap[key] || enMap[key];
    newLines.push(`  "${key}": "${urVal}",`);
  }
  
  // Insert after last entry
  lines.splice(lastEntryIndex + 1, 0, ...newLines);
  
  fs.writeFileSync(`catalog/${lang}.ts`, lines.join('\n'));
  console.log(`  Added ${missing.length} entries`);
}

console.log('\nDone!');
