const fs = require('fs');

// All untranslated English keys → proper Urdu translations
const urTranslations = {
  "app.shell.nav.crops": "فصلیں",
  "app.weather.metric.temperature": "درجہ حرارت",
  "app.weather.metric.precipitation": "بارش",
  "app.weather.metric.wind": "ہوا",
  "app.weather.metric.humidity": "نمی",
  "app.prices.loading": "قیمتیں لوڈ ہو رہی ہیں...",
  "app.prices.retry": "دوبارہ کوشش کریں",
  "app.prices.noPricesForCrop": "اس فصل کے قریب کوئی قیمت نہیں ملی۔",
  "app.prices.comingSoon": "جلد آ رہا ہے",
  "app.crops.results.rank": "درجہ {n}",
  "app.crops.results.sourceWeather": "موسم",
  "app.crops.results.sourceMarket": "بازار",
  "app.crops.results.sourceSoil": "مٹی",
  "app.crops.detail.suitability": "مناسب",
  "app.crops.detail.weatherFit": "موسمی مطابقت",
  "app.crops.detail.profitability": "منافع بخش",
  "app.crops.detail.risk": "خطرہ (کم بہتر ہے)",
  "app.crops.detail.sustainability": "پائیداری",
  "app.crops.detail.final": "حتمی اسکور",
  "app.crops.detail.dataFreshness": "ڈیٹا عمر: {seconds} سیکنڈ",
  "app.crops.compare.chartAria": "تین تجویز کردہ فصلوں کے درمیان آمدنی کا موازنہ بار چارٹ",
  "app.crops.catalogue.barley": "جَو",
  "app.crops.catalogue.bajra": "بajra",
  "app.crops.catalogue.jowar": "جَوار",
  "app.crops.catalogue.tobacco": "تمباکو",
  "app.crops.seasons.winter": "سردی",
  "app.farms.stages.harvest": "کٹائی",
  "app.records.types.harvest": "کٹائی",
  "app.crops.seasons.summer": "گرمی",
  "app.crops.seasons.autumn": "خزاں",
  "app.crops.seasons.spring": "بہار",
  "app.crops.seasons.rainy": "بارش",
  "app.crops.seasons.windy": "ہوا",
  "app.crops.budget.low": "کم (۲۵,۰۰۰ سے کم)",
  "app.crops.budget.very_high": "بہت زیادہ (۱,۲۰,۰۰۰ سے زیادہ)",
  "app.crops.irrigation.rainfed": "بارشی",
  "app.crops.irrigation.canal": "نہری",
  "app.crops.irrigation.tubewell": "ٹیوب ویل",
  "app.crops.irrigation.mixed": "ملتا جلتا",
  "app.crops.form.lowestViableWarning": "کوئی فصل قابل نہیں۔",
  "app.crops.form.switchBracket": "تبدیل کریں",
  "app.crops.form.noFarm": "پہلی فصل شامل کریں۔",
  "app.crops.form.geoError": "پاکستان درکار ہے۔",
  "app.crops.form.regionalSoilNote": "آپ کی مقامی مٹی۔",
  "app.crops.form.nationalSoilNote": "قومی اوسط۔",
  "app.crops.results.noCandidates": "کوئی نہیں۔",
  "app.crops.results.replacedPlan": "تبدیل ہو گیا۔",
  "app.crops.rotation.savedTitle": "محفوظ",
  "app.crops.catalogue.empty": "کوئی نہیں۔",
  "app.crops.errors.serviceUnavailable": "سروس دستیاب نہیں۔",
  "app.crops.errors.generic": "خرابی ہوئی۔",
  "app.crops.errors.notFound": "نہیں ملا۔",
  "app.crops.errors.rateLimited": "بہت زیادہ درخواستیں۔",
  "app.crops.water.low": "کم",
  "app.crops.water.medium": "درمیانی",
  "app.crops.water.high": "زیادہ",
  "app.crops.confidence.high": "زیادہ",
  "app.crops.confidence.medium": "درمیانی",
  "app.crops.confidence.low": "کم",
  "app.crops.confidence.unreliable": "قابل اعتماد نہیں",
  "app.crops.risk.price_volatility": "قیمت میں اتار چڑھاؤ",
  "app.crops.risk.pest_pressure": "کیڑے مکوڑوں کا خطرہ",
  "app.crops.risk.weather": "موسمی خطرہ",
  "app.crops.risk.water_stress": "پانی کی کمی",
  "app.crops.risk.input_cost": "انپٹ لاگت",
  "app.crops.soilImpact.improves": "بہتر",
  "app.crops.soilImpact.neutral": "بے اثر",
  "app.crops.soilImpact.depletes": "کمزور",
  "app.crops.compare.title": "فصلوں کا موازنہ کریں",
  "app.crops.compare.close": "بند کریں",
  "app.crops.compare.revenue": "تخمینی آمدنی",
  "app.crops.compare.duration": "دن",
  "app.crops.compare.water": "پانی",
  "app.crops.compare.marketRisk": "بازار کا خطرہ",
  "app.crops.compare.soilImpact": "مٹی پر اثر",
  "app.crops.compare.labour": "مشقت لاگت",
  "app.crops.compare.selectToSave": "منتخب کریں",
  "app.crops.compare.saveSelected": "محفوظ کریں",
  "app.crops.detail.back": "واپس",
  "app.crops.detail.confidence": "اعتبار",
  "app.crops.detail.scoreBreakdown": "اسکور",
  "app.crops.form.farmTitle": " farmکا انتخاب کریں",
  "app.crops.form.seasonTitle": "موسم",
  "app.crops.form.yearTitle": "سال",
  "app.crops.form.soilTitle": "مٹی کی قسم",
  "app.crops.form.irrigationTitle": "آبپاشی",
  "app.crops.form.budgetTitle": "بجٹ",
};

// Fix ur.ts
let ur = fs.readFileSync('catalog/ur.ts', 'utf8');
let fixCount = 0;
for (const [key, value] of Object.entries(urTranslations)) {
  const escaped = key.replace(/\./g, '\\.');
  // Replace only if value is still English
  const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
  const match = regex.exec(ur);
  if (match) {
    // Check if current value is English
    const currentVal = match[0].match(/"([^"]*)"$/)[1];
    if (/^[a-zA-Z\s{}.:,!?()/\-]+$/.test(currentVal) && currentVal !== value) {
      ur = ur.replace(regex, '$1"' + value + '"');
      fixCount++;
    }
  }
}
fs.writeFileSync('catalog/ur.ts', ur);
console.log('ur.ts: ' + fixCount + ' fixes');

// Now copy ur.ts to all 6 locales
const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];
ur = fs.readFileSync('catalog/ur.ts', 'utf8');

for (const code of locales) {
  let content = ur;
  content = content.replace(/export const ur/g, 'export const ' + code);
  content = content.replace(
    /export type CatalogKey = keyof typeof ur;/,
    'export type CatalogKey = keyof typeof ' + code + ';'
  );
  fs.writeFileSync('catalog/' + code + '.ts', content);
  console.log('Written catalog/' + code + '.ts');
}

console.log('Done!');
