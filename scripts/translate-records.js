const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  ['"app.records.eyebrow": "Farm records"', '"app.records.eyebrow": "فارم رڪارڊ"'],
  ['"app.records.types.irrigation": "Irrigation"', '"app.records.types.irrigation": "آبياري"'],
  ['"app.records.types.fertilizer": "Fertilizer"', '"app.records.types.fertilizer": "کِيڪ"'],
  ['"app.records.types.pesticide": "Pesticide"', '"app.records.types.pesticide": "ڪمائي دوا"'],
  ['"app.records.types.disease": "Disease"', '"app.records.types.disease": "بيماري"'],
  ['"app.records.types.harvest": "Harvest"', '"app.records.types.harvest": "ڦڙي"'],
  ['"app.records.new.heading": "Log what happened in the field"', '"app.records.new.heading": "فيڊڊ ۾ ڪهڙو واقعو ٿيو ٿو ليکيو"'],
  ['"app.records.new.fields.type": "What happened?"', '"app.records.new.fields.type": "ڪهڙو واقعو ٿيو؟"'],
  ['"app.records.new.fields.farm": "Farm"', '"app.records.new.fields.farm": "فارم"'],
  ['"app.records.new.placeholders.farm": "Choose farm"', '"app.records.new.placeholders.farm": "فارم چونڊيو"'],
  ['"app.records.new.fields.date": "Date"', '"app.records.new.fields.date": "تاريخ"'],
  ['"app.records.new.fields.title": "Short title"', '"app.records.new.fields.title": "مختصر عنوان"'],
  ['"app.records.new.fields.optional": "(optional)"', '"app.records.new.fields.optional": "(اختياري)"'],
  ['"app.records.new.placeholders.titleIrrigation": "e.g. Canal turn · full field"', '"app.report.new.placeholders.titleIrrigation": "جئن نيهر · پورو فيلڊ"'],
  ['"app.records.new.placeholders.titleOther": "Second dose along ridges"', '"app.records.new.placeholders.titleOther": "ڊوسري ڊوز ڌارن تي"'],
  ['"app.records.new.fields.details": "Details"', '"app.records.new.fields.details": "تفصيل"'],
  ['"app.records.new.buttons.save": "Save record"', '"app.records.new.buttons.save": "رڪارڊ بچائيو"'],
  ['"app.records.new.success.heading": "Record saved in demo"', '"app.records.new.success.heading": "رڪارڊ ڊيمو ۾ بچائي وئو"'],
  ['"app.records.new.success.backToDashboard": "Back to dashboard"', '"app.records.new.success.backToDashboard": "ڊيٽاشيلڊ تي واپس"'],
  ['"app.records.new.success.viewFarms": "View my farms"', '"app.records.new.success.viewFarms": "مون جا فارم ڏيکاريو"'],
  ['"app.records.new.errors.farmRequired": "Pick which farm this happened on."', '"app.records.new.errors.farmRequired": "ڪنھن فارم تي ٿيو چونڊيو."'],
  ['"app.records.new.errors.dateRequired": "Pick the date."', '"app.records.new.errors.dateRequired": "تاريخ چونڊيو."'],
];

let ok = 0, fail = 0;
for (const [from, to] of translations) {
  if (sd.includes(from)) {
    sd = sd.replace(from, to);
    ok++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 65));
    fail++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Records: ${ok} replaced, ${fail} not found.`);
