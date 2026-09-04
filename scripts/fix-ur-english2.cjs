const fs = require('fs');

const moreTranslations = {
  "app.crops.catalogue.sunflower": "سورج مکھی",
  "app.crops.catalogue.canola": "سرسوں",
  "app.crops.catalogue.sesame": "تل",
  "app.crops.catalogue.lentil": "مسور",
  "app.crops.catalogue.pigeon_pea": "دوسرا",
  "app.crops.catalogue.black_gram": "کالی دال",
  "app.crops.catalogue.cowpea": "لوبیا",
  "app.crops.catalogue.cauliflower": "پھول گوبھی",
  "app.crops.catalogue.cabbage": "بند گوبھی",
  "app.crops.catalogue.brinjal": "بینگن",
  "app.crops.catalogue.okra": "بامی",
  "app.crops.catalogue.chili": "مرچ",
  "app.crops.catalogue.garlic": "لہسن",
  "app.crops.catalogue.ginger": "ادرک",
  "app.crops.catalogue.cucumber": "کھیرا",
  "app.crops.catalogue.watermelon": "تربوز",
  "app.crops.catalogue.pumpkin": "کدو",
  "app.crops.catalogue.carrot": "گاجر",
  "app.crops.catalogue.spinach": "پالک",
  "app.crops.catalogue.fenugreek": "شنبلیله",
  "app.crops.catalogue.mango": "آم",
  "app.crops.catalogue.citrus": "مالٹا",
  "app.crops.catalogue.guava": "امرود",
  "app.crops.catalogue.apple": "سیب",
  "app.crops.catalogue.barley": "جو",
  "app.crops.catalogue.bajra": "بجرا",
  "app.crops.catalogue.jowar": "جوار",
  "app.crops.catalogue.tobacco": "تمباکو",
  "app.crops.rotation.barley_then_chickpea": "جو کے بعد چنا - فصلوں کا چکر منافع بخش",
  "app.crops.catalogue.pea": "مٹر",
  "app.crops.soil.sandy": "ریتیل",
  "app.crops.soil.sandy_loam": "ریتیل مٹی",
  "app.crops.soil.loamy": "چکنی مٹی",
  "app.crops.soil.clay_loam": "چکنی مٹی",
  "app.crops.soil.clay": "چکنا",
  "app.crops.soil.silty": "گیلی مٹی",
  "app.crops.soil.saline": "نمکین",
  "app.crops.soil.rocky": "چٹانی",
  "app.crops.soil.other": "دیگر",
  "app.crops.form.soilOther": "دیگر",
};

let ur = fs.readFileSync('catalog/ur.ts', 'utf8');
let fixCount = 0;
for (const [key, value] of Object.entries(moreTranslations)) {
  const escaped = key.replace(/\./g, '\\.');
  const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
  const match = regex.exec(ur);
  if (match) {
    const currentVal = match[0].match(/"([^"]*)"$/)[1];
    if (/^[a-zA-Z\s{}.:,!?()/\-]+$/.test(currentVal) && currentVal !== value) {
      ur = ur.replace(regex, '$1"' + value + '"');
      fixCount++;
    }
  }
}
fs.writeFileSync('catalog/ur.ts', ur);
console.log('ur.ts: ' + fixCount + ' fixes');

// Copy to all locales
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
  console.log('Written ' + code + '.ts');
}
console.log('Done!');
