const fs = require('fs');

const rotationTranslations = {
  "app.crops.rotation.bajra_then_cowpea": "بجرا کے بعد لوبیا - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.sunflower_then_wheat": "سورج مکھی کے بعد گندم - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.canola_then_wheat": "سرسوں کے بعد گندم - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.lentil_then_cotton": "مسور کے بعد کپاس - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.pea_then_maize": "مٹر کے بعد مکئی - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.cauliflower_then_pea": "پھول گوبھی کے بعد مٹر - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.okra_then_cowpea": "بامی کے بعد لوبیا - فصلوں کا چکر منافع بخش",
  "app.crops.rotation.garlic_then_wheat": "لہسن کے بعد گندم - فصلوں کا چکر منافع بخش",
};

let ur = fs.readFileSync('catalog/ur.ts', 'utf8');
let fixCount = 0;
for (const [key, value] of Object.entries(rotationTranslations)) {
  const escaped = key.replace(/\./g, '\\.');
  const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
  const match = regex.exec(ur);
  if (match) {
    const currentVal = match[0].match(/"([^"]*)"$/)[1];
    if (currentVal !== value) {
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
