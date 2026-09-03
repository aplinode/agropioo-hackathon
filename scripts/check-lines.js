const fs = require('fs');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const keys = [
  'su.registered.body',
  'app.shell.metadataDescription',
  'app.dashboard.weatherUnavailable',
  'app.farms.detail.noRecords',
  'app.records.farmRecords.description',
  'app.records.farmRecords.demoNotice',
  'app.records.new.description',
  'app.records.new.success.description',
];
for (const k of keys) {
  const line = sd.split('\n').find(l => l.includes('"' + k + '"'));
  if (line) {
    console.log(k + ': ' + JSON.stringify(line.trim()));
  } else {
    console.log(k + ': NOT IN FILE');
  }
}
