const fs = require('fs');

const fixes = {
  "app.shell.nav.profitLoss": "فائدہ / نقصان",
  "app.records.noRecordsFound": "ھن فلٹر لاء کوئي ریکارڊ نه مليل.",
  "offline.title": "توهين آف لائن آهيو",
  "offline.reload": "ٻيهر هڅه ڪريو",
  "offline.home": "هوم ته وڃو",
  "offline.installTitle": "هوم اسکرين ته شامل ڪريو",
  "offline.installAction": "هوم اسکرين ته شامل ڪريو",
  "offline.dismiss": " رد ڪريو",
  "app.satellite.cloudCoverYes": "بادلارت",
};

const filePath = 'catalog/sd.ts';
let content = fs.readFileSync(filePath, 'utf8');
let count = 0;
for (const [key, value] of Object.entries(fixes)) {
  const escaped = key.replace(/\./g, '\\.');
  const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
  if (regex.test(content)) {
    content = content.replace(regex, '$1"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
    count++;
  }
}
fs.writeFileSync(filePath, content);
console.log('sd.ts: translated ' + count + ' keys');
