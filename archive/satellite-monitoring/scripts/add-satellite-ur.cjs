const fs = require('fs');

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');

// Satellite keys — Urdu translations
const satelliteUr = {
  "app.satellite.nav": "سیٹلائٹ",
  "app.satellite.pageTitle": "کھیت کی نگرانی — ایگروپیو",
  "app.satellite.eyebrow": "سیٹلائٹ مونیٹرنگ",
  "app.satellite.title": "اپنے کھیتوں کو خلا سے دیکھیں",
  "app.satellite.description": "ڈرون کی معلومات کے بغیر اپنی فصل کی صحت کی نگرانی کریں۔",
  "app.satellite.farmSelectorLabel": "کھیت",
  "app.satellite.selectFarmPrompt": "کھیت کی صحت دیکھنے کے لیے کھیت منتخب کریں۔",
  "app.satellite.noFarms": "ابھی تک کوئی کھیت درج نہیں۔",
  "app.satellite.drawBoundaryBtn": "کھیت کی سرحد بنائیں",
  "app.satellite.saveBoundaryBtn": "سرحد محفوظ کریں",
  "app.satellite.cancelDrawBtn": "ڈرائنگ منسوخ کریں",
  "app.satellite.clearBoundaryBtn": "سرحد صاف کریں",
  "app.satellite.drawInstructions": "کھیت کے گرد کلک کریں، پھر ختم کرنے کے لیے دہرائیں",
  "app.satellite.drawing": "سرحد بنائی جا رہی ہے...",
  "app.satellite.savingBoundary": "سرحد محفوظ ہو رہی ہے...",
  "app.satellite.processingTitle": "سیٹلائٹ تصاویر پر کارروائی ہو رہی ہے...",
  "app.satellite.processingBody": "ہم پچھلے کچھ دنوں میں سب سے صاف تصاویر تلاش کر رہے ہیں۔",
  "app.satellite.processingSub": "براہ کرم انتظار کریں...",
  "app.satellite.noBoundaryTitle": "کھیت کی سرحد مقرر نہیں",
  "app.satellite.noBoundaryBody": "سیٹلائٹ نگرانی شروع کرنے کے لیے پہلے اپنے کھیت کی سرحد بنائیں۔",
  "app.satellite.noSnapshots": "ابھی تک کوئی صحت اسنیپ شاٹ نہیں۔",
  "app.satellite.noSnapshotsBody": "آپ کی پہلی سیٹلائٹ تصویر یہاں دکھائی دے گی۔",
  "app.satellite.cloudCover": "بادلوں کا پردہ",
  "app.satellite.cloudCoverYes": "بادلی",
  "app.satellite.cloudCoverNo": "صاف",
  "app.satellite.weekEnding": "ہفتہ {date}",
  "app.satellite.weekStartShort": "ہفتہ {date}",
  "app.satellite.meanNdvi": "اوسط NDVI",
  "app.satellite.health": "صحت",
  "app.satellite.dateCol": "تاریخ",
  "app.satellite.legendTitle": "NDVI پیمانہ",
  "app.satellite.legend.waterShadow": "پانی / سایہ",
  "app.satellite.legend.stressed": "دباؤ میں",
  "app.satellite.legend.moderate": "درمیانی",
  "app.satellite.legend.healthy": "صحت مند",
  "app.satellite.jobPending": "قطار میں",
  "app.satellite.jobProcessing": "کارروائی ہو رہی ہے",
  "app.satellite.jobCompleted": "تیار",
  "app.satellite.jobFailed": "ناکام",
  "app.satellite.jobFailedBody": "تازہ ترین سیٹلائٹ تجزیہ مکمل نہیں ہو سکا۔",
  "app.satellite.retry": "دوبارہ کوشش کریں",
  "app.satellite.refreshStatus": "ابھی تازہ کریں",
  "app.satellite.refreshing": "تازہ ہو رہا ہے...",
  "app.satellite.historyHeading": "12 ہفتے کی تاریخ",
  "app.satellite.historyEmpty": "ابھی تک کوئی اسنیپ شاٹ نہیں۔",
  "app.satellite.healthGood": "اچھا",
  "app.satellite.healthWatch": "دیکھیں",
  "app.satellite.healthStressed": "دباؤ میں",
  "app.satellite.loading": "لوڈ ہو رہا ہے...",
  "app.satellite.noImagery": "اس کھیت کے لیے کوئی صاف سیٹلائٹ تصویر نہیں ملی۔",
  "app.satellite.error.generic": "کچھ غلط ہوا۔ براہ کرم دوبارہ کوشش کریں۔",
  "app.satellite.error.serviceUnavailable": "سیٹلائٹ تصاویر ع暂时 دستیاب نہیں۔",
  "app.satellite.error.noFarm": "سیٹلائٹ مونیٹرنگ دیکھنے کے لیے کھیت منتخب کریں۔",
  "app.satellite.mapLegend": "رنگ پیمانہ",
  "app.satellite.zoomToFarm": "میرے کھیت پر زوم کریں",
  "app.satellite.boundarySaved": "سرحد محفوظ ہو گئی۔ سیٹلائٹ تصاویر کی جانچ ہو رہی ہے...",
  "app.satellite.boundaryError": "سرحد محفوظ نہیں ہو سکی۔ براہ کرم شیپ دیکھیں۔",
  "app.satellite.areaTooLarge": "کشیدہ علاقہ بہت بڑا ہے — براہ کرم چھوٹا بنائیں۔",
  "app.satellite.areaOutsidePk": "کوآرڈینیٹس پاکستان کے باہر لگتے ہیں۔ براہ کرم دوبارہ بنائیں۔",
  "app.satellite.invalidBoundary": "غلط کھیت کی سرحد — براہ کرم دوبارہ بنائیں۔",
  "app.satellite.legendNodata": "کوئی ڈیٹا نہیں",
};

// Add to ur.ts before the closing };
let content = ur;
const insertBefore = '};\n\nexport type CatalogKey';
let newLines = '';
for (const [key, value] of Object.entries(satelliteUr)) {
  if (!content.includes('"' + key + '"')) {
    newLines += `  "${key}": "${value.replace(/"/g, '\\"')}",\n`;
  }
}

if (newLines) {
  // Insert before the last };
  const lastBrace = content.lastIndexOf('};');
  content = content.substring(0, lastBrace) + newLines + content.substring(lastBrace);
}

fs.writeFileSync('catalog/ur.ts', content);
console.log('ur.ts updated with', Object.keys(satelliteUr).length, 'satellite keys');

// Now copy ur.ts to all 6 locales
const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];
const urContent = fs.readFileSync('catalog/ur.ts', 'utf8');
for (const code of locales) {
  let loc = urContent;
  loc = loc.replace(/export const ur/g, 'export const ' + code);
  loc = loc.replace(/export type CatalogKey = keyof typeof ur;/, 'export type CatalogKey = keyof typeof ' + code + ';');
  fs.writeFileSync('catalog/' + code + '.ts', loc);
  console.log('Written ' + code + '.ts');
}
console.log('Done!');
