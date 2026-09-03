const fs = require('fs');

// Get en.ts keys
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enKeys = [];
for (const line of en.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) enKeys.push(m[1]);
}
console.log('en.ts keys:', enKeys.length);

// For each locale, remove keys not in en.ts and add missing keys from en.ts
const locales = ['ur', 'ps', 'sd', 'pa', 'bal', 'skr', 'hno'];

for (const code of locales) {
  const filePath = 'catalog/' + code + '.ts';
  let content = fs.readFileSync(filePath, 'utf8');

  // Parse current keys and values
  const currentMap = {};
  for (const line of content.split('\n')) {
    const m = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) currentMap[m[1]] = m[2];
  }

  const currentKeys = Object.keys(currentMap);
  const missing = enKeys.filter(k => !currentKeys.includes(k));
  const extra = currentKeys.filter(k => !enKeys.includes(k));

  console.log(code + ': ' + currentKeys.length + ' keys, ' + missing.length + ' missing, ' + extra.length + ' extra');

  if (missing.length === 0 && extra.length === 0) continue;

  // Rebuild file from en.ts structure
  const enLines = en.split('\n');
  let newContent = '';

  for (const line of enLines) {
    const m = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) {
      const key = m[1];
      const val = currentMap[key] || m[2]; // use locale value or fall back to English
      const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      newContent += '  "' + key + '": "' + escaped + '",\n';
    } else if (line.includes('import type') || line.includes('export') || line.includes('{') || line.includes('}') || line.trim() === '' || line.includes('/**')) {
      // Keep structure lines but update export name
      let l = line;
      if (l.includes('export const en')) l = l.replace('export const en', 'export const ' + code);
      if (l.includes('export type CatalogKey = keyof typeof en')) l = 'export type CatalogKey = keyof typeof ' + code + ';';
      if (l.includes('/**')) l = l.replace('English', code === 'ur' ? 'Urdu (اردو)' : code === 'ps' ? 'Pashto (پښتو)' : code === 'sd' ? 'Sindhi (سنڌي)' : code === 'pa' ? 'Punjabi (پنجابی)' : code === 'bal' ? 'Balochi (بلۏچی)' : code === 'skr' ? 'Saraiki (سرائیکی)' : 'Hindko (ہندکو)');
      newContent += l + '\n';
    }
  }

  fs.writeFileSync(filePath, newContent);
  console.log('  Written ' + code + '.ts');
}
