const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  // Weather advisory recommendations
  ['"app.weather.advisory.recommendation.irrigation": "Skip irrigation today — rain is expected. Save water and avoid waterlogging."', '"app.weather.advisory.recommendation.irrigation": "اڄ آبياري ڇڏو — پانهَن متوقع آهي. پانهَن بچائيو ۽ ڇيل کان بچو."'],
  ['"app.weather.advisory.recommendation.irrigateNow": "Irrigate in the cool hours (before 9 AM) — heat is building and the soil is drying."', '"app.weather.advisory.recommendation.irrigateNow": "سرهه ڪنن ۾ آبياري ڪريو (9 AM کان پاڻ) — گرمي وڌي رھي آهي ۽ مٹي خشڪ ٿي رھي آهي."'],
  ['"app.weather.advisory.recommendation.fertilize": "Good window to apply fertiliser ahead of steady weather."', '"app.weather.advisory.recommendation.fertilize": "IntervalSince وڌيڪ موسم کان پاڻ کيڪ لاڳو ڪرڻ جو وينڊو آهي."'],
  ['"app.weather.advisory.recommendation.sprayDisease": "Humidity favours disease — apply preventive fungicide in the dry morning window."', '"app.weather.advisory.recommendation.sprayDisease": "نم بيماري لاءِ م有利 — خشک سحري ونڊو ۾ احتياطي فائINGER لاڳو ڪريو."'],
  ['"app.weather.advisory.recommendation.heatProtect": "Extreme heat — increase irrigation and avoid field work midday."', '"app.weather.advisory.recommendation.heatProtect": "ڍندڙ گرم — آبياري وڌو ۽ دوپاھر فيلڊ ڪم کان بچو."'],
  ['"app.weather.advisory.recommendation.frostProtect": "Frost risk tonight — cover young plants or irrigate to warm the soil."', '"app.weather.advisory.recommendation.frostProtect": "آج رات پالو جو خطر — نوان پودن کان ڍنڍي يا مٹي گرم ڪرڻ لاءِ آبياري ڪريو."'],
  ['"app.weather.advisory.recommendation.harvest": "Crops near harvest — plan the harvest for a dry day and protect ripe produce from rain."', '"app.weather.advisory.recommendation.harvest": "ڦڙي قريبتي — خشک ڏينهن لاءِ ڦڙي منصوبو ڪريو ۽ پڪ وڌ پانهَن کان بچائيو."'],
  ['"app.weather.advisory.recommendation.plantCare": "Steady growth stage — keep up regular irrigation and weeding."', '"app.weather.advisory.recommendation.plantCare": " utilise وڌ جو مرحلو — عام آبياري ۽ ڳاڙهي جاري رکو."'],
  ['"app.weather.advisory.recommendation.generic": "No special action today — keep an eye on the field and the forecast."', '"app.weather.advisory.recommendation.generic": "اڄ ڪوئي خاص عمل نه — فيلڊ ۽ اَنuman تي نظر رکو."'],
  // Prices admin
  ['"app.prices.adminTitle": "Manual price entry"', '"app.prices.adminTitle": "دستي قيمت داخل"'],
  ['"app.prices.adminDate": "Date"', '"app.prices.adminDate": "تاريخ"'],
  ['"app.prices.adminModalPrice": "Modal price"', '"app.prices.adminModalPrice": "Mujawana قيمت"'],
  ['"app.prices.adminMinPrice": "Min price"', '"app.prices.adminMinPrice": "ڪم قيمت"'],
  ['"app.prices.adminMaxPrice": "Max price"', '"app.prices.adminMaxPrice": "وڌيڪ قيمت"'],
  ['"app.prices.adminHoliday": "Market holiday"', '"app.prices.adminHoliday": "بازار جي چھڏي"'],
  ['"app.prices.adminSave": "Save price"', '"app.prices.adminSave": "قيمت بچائيو"'],
  // Misc
  ['"app.dashboard.aria.dismissChecklist": "Dismiss setup checklist"', '"app.dashboard.aria.dismissChecklist": "سيٽ اپ چيڪلسٽ بند ڪريو"'],
  ['"app.dashboard.aria.setupProgress": "Setup progress"', '"app.dashboard.aria.setupProgress": "سيٽ اپ ترقي"'],
  ['"app.weather.description": "Daily farming advice for your crops, driven by the forecast and your crop\'s growth stage."', '"app.weather.description": "ٻج، موسم، ۽ وڌ جي مرحلو تي مبني روزانه ڪسان جي مشورو."'],
  ['"app.weather.forecastSubtitle": "Each day\'s weather with a farming recommendation for your crop."', '"app.weather.forecastSubtitle": "هر ڏينهن جو موسم ٻج لاءِ ڪسان جي سفارش سان."'],
  ['"app.weather.registerBody": "Add your crop, sowing date, and location to start getting personalised daily advice."', '"app.weather.registerBody": "شخصي روزانه مشورو حاصل ڪرڻ لاءِ ٻج، ڦڙين جي تاريخ، ۽ جڳھ شامل ڪريو."'],
  ['"app.weather.historySubtitle": "Past recommendations for your farms, newest first."', '"app.weather.historySubtitle": "فارم لاءِ پڏيل سفارش، پہلي نئون."'],
  ['"app.weather.metric.temperature": "Temperature"', '"app.weather.metric.temperature": "TEMPerature"'],
  ['"app.prices.description": "Today\'s rates from nearby mandis, with a plain word on holding or selling."', '"app.prices.description": " قريبتي منڊي کان اڄ جا قيمت، روکڻ يا وڌڻ جي باري ۾."'],
];

let ok = 0, fail = 0;
for (const [from, to] of translations) {
  if (sd.includes(from)) {
    sd = sd.replace(from, to);
    ok++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 70));
    fail++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Remaining: ${ok} replaced, ${fail} not found.`);
