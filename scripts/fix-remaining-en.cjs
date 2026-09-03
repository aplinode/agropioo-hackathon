const fs = require('fs');

const fixes = {
  pa: {
    "hiw.loop.benefit1Desc": "پچھلے موسم کی بیماری، خوراک، اور تاریخیں اس موسم کا پہلا جواب بناتی ہیں۔",
    "app.shell.nav.profitLoss": "نفع / نقصان",
    "app.advisor.chat.emptyBody": "فصلوں، موسم، مٹی، اور بازاری قیموں پر مشورہ حاصل کرنے کے لیے گفتگو شروع کریں۔",
    "app.dashboard.pricesWidgetNoTracked": "قیمتیں دیکھنے کے لیے فصلیں ٹریک کریں",
    "app.records.noRecordsFound": "اس فلٹر کے لیے کوئی ریکارڈ نہیں ملا۔",
  },
  bal: {
    "hiw.loop.benefit1Desc": "ماza faaslay sa bimari, khoraak, aur tarikhaan is mausam ka pehla jawab banaati hain.",
    "app.shell.nav.profitLoss": "faayda / nuqsaan",
    "app.advisor.chat.emptyBody": "Faaslon, mausam, mitti, aur bazaar qeematon par mashwara haasil karne ke liye guftagu shuru karo.",
    "app.dashboard.pricesWidgetNoTracked": "Qeemtaan dekhan ke liye faaslaan track karo",
    "app.records.noRecordsFound": "Is filter ke liye koi record nahi mila.",
  },
  skr: {
    "hiw.loop.benefit1Desc": "Pichlay moosam di bimaari, khoraak, ate taarikhian is moosam da pehla jawaab banaandiyan ne.",
    "app.shell.nav.profitLoss": "faayda / nuqsaan",
    "app.advisor.chat.emptyBody": "Faslaan, moosam, mitti, ate bazaar qeematan 'te mashwara haasil karn lay gallbaat shuru karo.",
    "app.dashboard.pricesWidgetNoTracked": "Qeemataan vekhan lay faslaan track karo",
    "app.records.noRecordsFound": "Is filter lay koi record nahi milya.",
  },
  hno: {
    "hiw.loop.benefit1Desc": "Pichlay moosam di bimaari, khoraak, ate taarikhian is moosam da pehla jawaab banaandiyan ne.",
    "app.shell.nav.profitLoss": "faayda / nuqsaan",
    "app.advisor.chat.emptyBody": "Faslaan, moosam, mitti, ate bazaar qeematan 'te mashwara haasil karn lay gallbaat shuru karo.",
    "app.dashboard.pricesWidgetNoTracked": "Qeemataan vekhan lay faslaan track karo",
    "app.records.noRecordsFound": "Is filter lay koi record nahi milya.",
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
