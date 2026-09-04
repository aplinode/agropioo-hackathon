const fs = require('fs');

const fixes = {
  "offline.banner": "توهين آف لائن آهيو. توهان جو ڊيٽا محفوظ آهي ته مکان کان ڊائونلوڊ ڪيو ويو آهي.",
  "offline.body": "هي صف توهان جي ڊيوائس ته ڊائونلوڊ ڪيو ويو آهي ته توهين ٻيهر ڪم ڪري سکو. جيڪڏهن توهان جي انترنت واپس آئي، هر ڊيٽا جيනه شتون آهي محفوظ ٿي وڃي، اتو سان خودڪار همешو ٿي وڃي.",
  "offline.installBody": "ڪيفن ٿي سکو ۽ توهان جون کھيتيون ۽ رجسٽرون لاء مکمل آف لائن رسائي لاء اڳروپيو نصب ڪريو.",
  "offline.iosPrompt": "مکمل آف لائن رسائي لاء توهان جي کھيتي ته اڳروپيو شامل ڪريو. شیئر بٽن ٿيپي، ٻيهر کھيتي ته شامل ڪريو.",
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
