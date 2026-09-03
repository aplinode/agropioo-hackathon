const fs = require('fs');

const fixes = {
  bal: {
    "hiw.loop.benefit1Desc": "پچھلی موسم بیماری، خوراک، تاریخیں اس موسم کا پہلا جواب بناتی ہیں۔",
    "app.shell.nav.profitLoss": "فائدہ / نقصان",
    "app.advisor.chat.emptyBody": "فصلوں، موسم، مٹی، اور بازار قیمتوں پر مشورہ حاصل کرنے کے لیے گفتگو شروع کریں۔",
    "app.dashboard.pricesWidgetNoTracked": "قیمتیں دیکھنے کے لیے فصلیں ٹریک کریں",
    "app.records.noRecordsFound": "اس فلٹر کے لیے کوئی ریکارڈ نہیں ملا۔",
  },
  skr: {
    "hiw.loop.benefit1Desc": "پچھلے موسم دی بیماری، خوراک، تاریخیں اس موسم دا پہلا جواب بنا دیاں نے۔",
    "app.shell.nav.profitLoss": "فائدہ / نقصان",
    "app.advisor.chat.emptyBody": "فصلوں، موسم، مٹی، بازار قیمتواں تے مشورہ حاصل کرن لئی گفتگو شروع کرو۔",
    "app.dashboard.pricesWidgetNoTracked": "قیمتاں دیکھن لئی فصلیں ٹریک کرو",
    "app.records.noRecordsFound": "اس فلٹر لئی کوئی ریکارڈ نہیں ملیا۔",
  },
  hno: {
    "hiw.loop.benefit1Desc": "پچھلے موسم دی بیماری، خوراک، تاریخیں اس موسم دا پہلا جواب بنا دیاں نے۔",
    "app.shell.nav.profitLoss": "فائدہ / نقصان",
    "app.advisor.chat.emptyBody": "فصلوں، موسم، مٹی، بازار قیمتواں تے مشورہ حاصل کرن لئی گفتگو شروع کرو۔",
    "app.dashboard.pricesWidgetNoTracked": "قیمتاں دیکھن لئی فصلیں ٹریک کرو",
    "app.records.noRecordsFound": "اس فلٹر لئی کوئی ریکارڈ نہیں ملیا۔",
  },
};

for (const [code, translations] of Object.entries(fixes)) {
  let content = fs.readFileSync('catalog/' + code + '.ts', 'utf8');
  for (const [key, value] of Object.entries(translations)) {
    const escaped = key.replace(/\./g, '\\.');
    const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
    content = content.replace(regex, '$1"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
  }
  fs.writeFileSync('catalog/' + code + '.ts', content);
  console.log('Fixed ' + code + '.ts');
}
