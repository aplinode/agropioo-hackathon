const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const replacements = [
  // hiw.record.body - uses ' and —
  [
    "\"hiw.record.body\": \"Recording is built for the field — big buttons, few fields, no typing required. Each entry becomes part of the farm's memory, so advice keeps sharpening while the crop keeps growing.\",",
    "\"hiw.record.body\": \"رڪارڊن فيلڊ لاءِ ٺھائي وئي آهي — ڏاڍا بٽن، گهٽ فيلڊ، ٽائپن جي ضرورت نه. ھر داخلو فارم جي ياد رکڻ جو حصو بڻي ٿو، پنھن مشورو ڳڍي وڃي ٿو جڇھن ٻج وڌي.\","
  ],
  // su.registered.body - uses ' (regular apostrophe) and — (actual em-dash)
  [
    "\"su.registered.body\": \"Sign in instead, or reset your password if you've forgotten it — your farm is waiting where you left it.\",",
    "\"su.registered.body\": \"سائن ان ڪريو، يا پنھن پاسورڊ ريسٽ ڪريو جيڪو توھان وڃريل آهي — توھان جو فارم توھان ڇڏي جاتا انتظار.\","
  ],
  // app.shell.metadataDescription - uses ' and —
  [
    "\"app.shell.metadataDescription\": \"Today's advisory, weather, alerts, and every Agropioo tool — built for Pakistan. A product of Aplinode.\",",
    "\"app.shell.metadataDescription\": \"اڄ جا مشورا، موسم، Alerts، ۽ ھر Agropioo ٽول — پاکستان لاءِ ٺھائي. Aplinode جو product.\","
  ],
  // app.dashboard.weatherUnavailable - uses \u2019 and \u2014
  [
    "\"app.dashboard.weatherUnavailable\": \"Weather isn\\u2019t loading right now. Check again in a little while \\u2014 your advisories keep working meanwhile.\",",
    "\"app.dashboard.weatherUnavailable\": \"موسم ھاڻي لوڊ ڪري ٿو. ٻڌي ڪنھن کان پاڻ چيڪ ڪريو \\u2014 توهان جا مشورا دوسرن ڪم ڪري ٿا.\","
  ],
  // app.farms.detail.noRecords - uses ' and —
  [
    "\"app.farms.detail.noRecords\": \"No records yet — start logging field events to build your farm's memory.\",",
    "\"app.farms.detail.noRecords\": \"ھاڻي تائين رڪارڊ نه آهن — فيلڊ جي واقعن جو رڪارڊ شروع ڪريو ته فارم جي ياد رکڻ بڻجي.\","
  ],
  // app.records.farmRecords.description - uses \u2014 and \u2019
  [
    "\"app.records.farmRecords.description\": \"Every irrigation, spray, and treatment written down \\u2014 so decisions next week don\\u2019t rely on memory.\",",
    "\"app.records.farmRecords.description\": \"ھر آبياري، پري، ۽ علاج ليکيو وئي آهي \\u2014 پنھيل هفتي ۾ فيصلا ياد رکڻ تي منحصر نه.\","
  ],
  // app.records.farmRecords.demoNotice - uses \u00b7 \u2014 \u2019
  [
    "\"app.records.farmRecords.demoNotice\": \"DEMO \\u00b7 sample entries only \\u2014 saving new ones isn\\u2019t wired yet\",",
    "\"app.records.farmRecords.demoNotice\": \"DEMO \\u00b7 نمونا داخلا ڪل \\u2014 نون بچائڻ اڃا wired نه آهي.\","
  ],
  // app.records.new.description - uses \u2014 and \u2019
  [
    "\"app.records.new.description\": \"Irrigation, fertilizer, pesticide, disease, and harvest entries \\u2014 your farm\\u2019s memory, one line at a time.\",",
    "\"app.records.new.description\": \"آبياري، کِيڪ، ڪمائي دوا، بيماري، ۽ ڦڙي جا داخلا \\u2014 فارم جي ياد رکڻ، ھڪ ليڪ ھڪ ويه.\","
  ],
  // app.records.new.success.description - uses \u2019
  [
    "\"app.records.new.success.description\": \"In the full build this entry would appear in your farm\\u2019s record log and sharpen future advisories.\",",
    "\"app.records.new.success.description\": \"پوري ٺڻي ۾ ھن داخلو توهان جي فارم جي رڪارڊ ۾ نظر اچي ۽ مستقبل جا مشورا ڳڍي.\","
  ],
];

let ok = 0, fail = 0;
for (const [from, to] of replacements) {
  if (sd.includes(from)) {
    sd = sd.replace(from, to);
    ok++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 70));
    fail++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Done. ${ok} replaced, ${fail} not found.`);
