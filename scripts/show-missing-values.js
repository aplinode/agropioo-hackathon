const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');

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

// For each missing key, find its value in en.ts
// We need to handle multi-line values (template literals, concatenated strings)
for (const key of missing) {
  // Find the line with this key
  const keyPattern = `"${key}":`;
  const lines = en.split('\n');
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(keyPattern)) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) {
    console.log(`--- ${key}: NOT FOUND ---`);
    continue;
  }
  
  // Collect lines until we find the closing
  let value = lines[startIdx];
  let depth = 0;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{' || ch === "'" || ch === '"') depth++;
      if (ch === '}' || ch === "'" || ch === '"') depth--;
    }
    if (i > startIdx) value += '\n' + lines[i];
    // Check if we hit a line that ends with just `,` or `},` after the first line
    if (i > startIdx && lines[i].match(/^\s*\},?\s*$/)) break;
    if (i > startIdx && lines[i].match(/^\s*"[^"]+"\s*:\s*/)) break;
  }
  
  console.log(`--- ${key} ---`);
  console.log(value);
  console.log();
}
