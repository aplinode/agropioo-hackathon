const fs = require('fs');
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const en = fs.readFileSync('catalog/en.ts', 'utf8');

// Keys that are still English in all locales
const enKeys = [
  "app.shell.nav.crops",
  "app.weather.metric.temperature",
  "app.weather.metric.precipitation",
  "app.weather.metric.wind",
  "app.weather.metric.humidity",
  "app.prices.loading",
  "app.prices.retry",
  "app.prices.noPricesForCrop",
  "app.prices.comingSoon",
  "app.crops.results.rank",
  "app.crops.results.sourceWeather",
  "app.crops.results.sourceMarket",
  "app.crops.results.sourceSoil",
  "app.crops.detail.suitability",
  "app.crops.detail.weatherFit",
  "app.crops.detail.profitability",
  "app.crops.detail.risk",
  "app.crops.detail.sustainability",
  "app.crops.detail.final",
  "app.crops.detail.dataFreshness",
  "app.crops.compare.chartAria",
  "app.crops.catalogue.barley",
  "app.crops.catalogue.bajra",
  "app.crops.catalogue.jowar",
  "app.crops.catalogue.tobacco",
  "app.crops.seasons.winter",
  "app.farms.stages.harvest",
  "app.records.types.harvest",
];

for (const key of enKeys) {
  // Find value in ur.ts
  const regex = new RegExp('"' + key.replace(/\./g, '\\.') + '"\\s*:\\s*"([^"]*)"', 'g');
  const urMatch = regex.exec(ur);
  const enRegex = new RegExp('"' + key.replace(/\./g, '\\.') + '"\\s*:\\s*"([^"]*)"', 'g');
  const enMatch = enRegex.exec(en);
  const urVal = urMatch ? urMatch[1] : 'NOT FOUND';
  const enVal = enMatch ? enMatch[1] : 'NOT FOUND';
  const isEnglish = /^[a-zA-Z\s{}.:,!?()-]+$/.test(urVal);
  console.log(key);
  console.log('  EN:', enVal);
  console.log('  UR:', urVal);
  console.log('  English?', isEnglish);
  console.log();
}
