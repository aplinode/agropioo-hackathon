const fs = require('fs');

const sdFixes = {
  "app.shell.nav.satellite": "سیٽلائيٽ",
  "app.satellite.nav": "سیٽلائيٽ",
  "app.satellite.eyebrow": "سیٽلائيٽ مانٽرنگ",
  "app.satellite.title": "خپن جون کھيتيي فضائي نظر ته ويو",
  "app.satellite.description": "نقشي ته کھيتي جي حدونه ٻڍيو. اسان ھن شهرن جي ۾ سڀ کان وڌيڪ وڌيڪ سیٽلائيٽ تصوير چيڪ ڪريسان ۽ NDVI صحت هیٽمیپ ڏياريان.",
  "app.satellite.farmSelectorLabel": "کھيتي",
  "app.satellite.selectFarmPrompt": "کھيتي جي صحت ويو.",
  "app.satellite.noFarms": "ھتي تائين ڪوئي کھيتي رجسٽرڊ نه آهي.",
  "app.satellite.drawBoundaryBtn": "کھيتي جي حدونه ٻڍيو",
  "app.satellite.saveBoundaryBtn": "حدونه سانڍيو",
  "app.satellite.cancelDrawBtn": "ٻڍائڻ منسوخ ڪريو",
  "app.satellite.clearBoundaryBtn": "حدونه صاف ڪريو",
  "app.satellite.drawInstructions": "خپن کھيتي جي چوڌاري چهڪوئي ٻڍيو. شکل بند ڪريو.",
  "app.satellite.processingBody": "اسان توهانجي کھيتي جي تازه سیٽلائيٽ ڊيٽا تجزيو ڪر رھا آهيون.",
  "app.satellite.processingSub": "ھن شهرن جي ۾ سڀ کان وڌيڪ وڌيڪ تصوير چيڪ ڪر رھا آهيون.",
  "app.satellite.noBoundaryTitle": "کھيتي جي حدونه نه آهي",
  "app.satellite.noBoundaryBody": "ھن کھيتي جي سیٽلائيٽ تصويرين ويو لاء حدونه ٻڍيو.",
  "app.satellite.noSnapshots": "ھتي تائين ڪوئي صحت تصوير نه آهي.",
  "app.satellite.noSnapshotsBody": "جب توهانجي پھريون سیٽلائيٽ جانچ پوري ٿي وڃي ٿي، اها هتي نظر اچي.",
  "app.satellite.cloudCover": "بادلن جي چھان",
  "app.satellite.cloudCoverYes": "بادلارت",
  "app.satellite.cloudCoverNo": "صاف",
  "app.satellite.weekEnding": "ھفتيو {date}",
  "app.satellite.weekStartShort": "ھفتيو {date}",
  "app.satellite.meanNdvi": "اوسط NDVI",
};

const filePath = 'catalog/sd.ts';
let content = fs.readFileSync(filePath, 'utf8');
let count = 0;
for (const [key, value] of Object.entries(sdFixes)) {
  const escaped = key.replace(/\./g, '\\.');
  const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
  if (regex.test(content)) {
    content = content.replace(regex, '$1"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
    count++;
  }
}
fs.writeFileSync(filePath, content);
console.log('sd.ts: translated ' + count + ' keys');
