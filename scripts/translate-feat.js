const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  // Features page
  ['"feat.hero.eyebrow": "Features"', '"feat.hero.eyebrow": "خصوصيت"'],
  ['"feat.hero.titleLead": "Everything your"', '"feat.hero.titleLead": "توھان جي ھر شيء"'],
  ['"feat.hero.titleAccent": "season asks for"', '"feat.hero.titleAccent": "موسم پڇي ٿو"'],
  ['"feat.hero.ctaPrimary": "Get early access"', '"feat.hero.ctaPrimary": "EARLY access حاصل ڪريو"'],
  ['"feat.hero.ctaSecondary": "See how it works"', '"feat.hero.ctaSecondary": "ڪيئن ڪم ڪري ٿو ڏيکاريو"'],
  ['"feat.hero.builtFor": "Built for Pakistan"', '"feat.hero.builtFor": "پاکستان لاءِ ٺھائي"'],
  ['"feat.hero.productOf": "A product of Aplinode"', '"feat.hero.productOf": "Aplinode جو product"'],
  ['"feat.hero.tile1Label": "Leaf scan"', '"feat.hero.tile1Label": "پتي اسڪين"'],
  ['"feat.hero.tile1Value": "94% ok"', '"feat.hero.tile1Value": "94% ٺيڪ"'],
  ['"feat.hero.tile2Label": "Mandi wheat"', '"feat.hero.tile2Label": "منڊي گندم"'],
  ['"feat.hero.tile3Label": "NDVI field"', '"feat.hero.tile3Label": "NDVI فيلڊ"'],
  ['"feat.hero.tile4Label": "Pest risk"', '"feat.hero.tile4Label": "آفات خطر"'],
  ['"feat.hero.tile4Value": "Low · 7d"', '"feat.hero.tile4Value": "کم · 7d"'],
  ['"feat.hero.voiceReady": "Voice advisory ready"', '"feat.hero.voiceReady": "آواز مشورو تيار"'],
  ['"feat.hero.smsLabel": "SMS alert · offline mode"', '"feat.hero.smsLabel": "SMS Alerts · آف لائن موڊ"'],
  ['"feat.intel.eyebrow": "Crop intelligence"', '"feat.intel.eyebrow": "ٻج انٽيليجنس"'],
  ['"feat.intel.included": "Included"', '"feat.intel.included": "شامل"'],
  ['"feat.intel.doctorCode": "F·01 · Vision"', '"feat.intel.doctorCode": "F·01 · ڏيڪ"'],
  ['"feat.intel.doctorTitle": "AI crop doctor"', '"feat.intel.doctorTitle": "AI ٻج جو ڊاڪٽر"'],
  ['"feat.intel.diseaseName": "Yellow rust"', '"feat.intel.diseaseName": "پيتو زنگ"'],
  ['"feat.intel.matchScore": "94% match"', '"feat.intel.matchScore": "94% ميل"'],
  ['"feat.intel.severityLabel": "Severity"', '"feat.intel.severityLabel": "شديدت"'],
  ['"feat.intel.severityValue": "Moderate"', '"feat.intel.severityValue": "درميانا"'],
  ['"feat.intel.pestCode": "F·02 · Forecast"', '"feat.intel.pestCode": "F·02 · اَنuman"'],
  ['"feat.intel.pestTitle": "Pest outbreak alerts"', '"feat.intel.pestTitle": "آفات جا اطلاعات"'],
  ['"feat.intel.pestAlert": "Saturday · locust risk 74% — cover young wheat"', '"feat.intel.pestAlert": "هنedar · ۾ڙ خطر 74% — نوان ڳم کان ڍنڍي"'],
  ['"feat.intel.weatherCode": "F·03 · Weather"', '"feat.intel.weatherCode": "F·03 · موسم"'],
  ['"feat.intel.weatherTitle": "Weather-aware advisories"', '"feat.intel.weatherTitle": "موسم ڄاڻي تي مشورا"'],
  ['"feat.intel.delayIrrigation": "Delay irrigation today"', '"feat.intel.delayIrrigation": "اڄ آبياري وڌو"'],
  ['"feat.intel.waterSaved": "Water saved"', '"feat.intel.waterSaved": "پانهَن بچائي وئو"'],
  ['"feat.intel.cropCode": "F·04 · Planning"', '"feat.intel.cropCode": "F·04 · منصوبن بنياد"'],
  ['"feat.intel.cropTitle": "Crop recommendation"', '"feat.intel.cropTitle": "ٻج جي سفارش"'],
  ['"feat.field.sub": "Satellite eyes on every acre and a read on every nearby mandi — so growth and se"', '"feat.field.sub": "سیلیٽ ۾ هر اڪر تي نظر ۽ هر قريبتي منڊي تي پڇو — وڌ ۽ قيمت جي باري ۾."'],
  ['"feat.field.ndviCode": "F·05 · Satellite"', '"feat.field.ndviCode": "F·05 · سیلیٽ"'],
  ['"feat.field.ndviTitle": "NDVI field monitoring"', '"feat.field.ndviTitle": "NDVI فيلڊ نگراني"'],
  ['"feat.field.weakZone": "Weak zone · row 2"', '"feat.field.weakZone": "ڪمزور زون · قطار 2"'],
  ['"feat.field.priceCode": "F·06 · Market"', '"feat.field.priceCode": "F·06 · بازار"'],
  ['"feat.field.priceTitle": "Mandi price predictor"', '"feat.field.priceTitle": "منڊي قيمت انuman"'],
  ['"feat.field.wheatTrend": "Wheat · 8 weeks"', '"feat.field.wheatTrend": "گندم · 8 هفتي"'],
  ['"feat.field.financeCode": "F·07 · Finance"', '"feat.field.financeCode": "F·07 · ماليات"'],
  ['"feat.field.rowInputs": "Inputs"', '"feat.field.rowInputs": "ڍ⛓"'],
  ['"feat.field.rowLabour": "Labour"', '"feat.field.rowLabour": "مzenia"'],
  ['"feat.field.rowIrrigation": "Irrigation"', '"feat.field.rowIrrigation": "آبياري"'],
  ['"feat.field.rowRevenue": "Revenue (est.)"', '"feat.field.rowRevenue": "آمدن (اَنuman)"'],
  ['"feat.field.netMargin": "Net margin"', '"feat.field.netMargin": "نيٽ margin"'],
  ['"feat.voice.eyebrow": "Access for everyone"', '"feat.voice.eyebrow": "هر هڪ لاءِ رسائي"'],
  ['"feat.voice.speakCode": "F·08 · Voice"', '"feat.voice.speakCode": "F·08 · آواز"'],
  ['"feat.voice.speakTitle": "Speak your question"', '"feat.voice.speakTitle": "سوال بوليو"'],
  ['"feat.voice.callCode": "F·09 · Call"', '"feat.voice.callCode": "F·09 · ڪال"'],
  ['"feat.voice.callTitle": "Dial a toll-free number"', '"feat.voice.callTitle": "TOLL FREE نمبر ڊائل ڪريو"'],
  ['"feat.voice.greetingLine": "Agropioo mein aapka swagat hai"', '"feat.voice.greetingLine": "Agropioo ۾ توھان جي استقبال آهي"'],
  ['"feat.voice.heardLine": "Awaaz samajh li — jawab tayar hai"', '"feat.voice.heardLine": "آواز سمجھي — جواب تيار آهي"'],
  ['"feat.voice.callEnded": "Call ended · summary saved"', '"feat.voice.callEnded": "ڪال ختم · خلاصه بچائي وئو"'],
  ['"feat.voice.anyPhone": "Works on any phone · no internet"', '"feat.voice.anyPhone": "ڪنھن بھي ٿائيفون تي ڪم ڪري ٿو · انٽرنيٽ نه"'],
  ['"feat.voice.offlineTitle": "Dead zones don\'t stop it"', '"feat.voice.offlineTitle": "منڊل زون رڪندا نه"'],
  ['"feat.voice.networkStatus": "Network status"', '"feat.voice.networkStatus": "نيٽورڪ حالت"'],
  ['"feat.voice.offlineQueued": "Offline · queued 3 records"', '"feat.voice.offlineQueued": "آف لائن · 3 رڪارڊ queue ۾"'],
  ['"feat.voice.smsStamp": "SMS · 07:42"', '"feat.voice.smsStamp": "SMS · 07:42"'],
  ['"feat.manage.sub": "History, subsidies, sustainability, and a community of farmers — the quiet featu"', '"feat.manage.sub": "تاريخ، سبزادی، پائيداري، ۽ ڪسان جي community — هنڌ features جي."'],
  ['"feat.manage.diaryCode": "F·11 · Records"', '"feat.manage.diaryCode": "F·11 · رڪارڊ"'],
  ['"feat.manage.diaryTitle": "Digital farm diary"', '"feat.manage.diaryTitle": "ڊجٽل فارم ڊائري"'],
  ['"feat.manage.tl1Date": "12 Aug"', '"feat.manage.tl1Date": "12 آگسٽ"'],
  ['"feat.manage.tl1Label": "Irrigation"', '"feat.manage.tl1Label": "آبياري"'],
  ['"feat.manage.tl1Detail": "Canal turn · 40 min"', '"feat.manage.tl1Detail": "نيهر · 40 منٽ"'],
  ['"feat.manage.tl2Date": "09 Aug"', '"feat.manage.tl2Date": "09 آگسٽ"'],
  ['"feat.manage.tl2Label": "Urea applied"', '"feat.manage.tl2Label": "يوريا لاڳو ٿيو"'],
  ['"feat.manage.tl2Detail": "25 kg / acre"', '"feat.manage.tl2Detail": "25 kg / اڪر"'],
  ['"feat.manage.tl3Date": "02 Aug"', '"feat.manage.tl3Date": "02 آگسٽ"'],
  ['"feat.manage.tl3Label": "Leaf scan"', '"feat.manage.tl3Label": "پتي اسڪين"'],
  ['"feat.manage.tl3Detail": "Cleared · no disease"', '"feat.manage.tl3Detail": "صاف · بيماري نه"'],
  ['"feat.manage.schemeCode": "F·12 · Schemes"', '"feat.manage.schemeCode": "F·12 · منصوبن"'],
  ['"feat.manage.check1": "Land holding verified"', '"feat.manage.check1": "زمين جي تائيد"'],
  ['"feat.manage.check2": "Crop season matches"', '"feat.manage.check2": "ٻج موسم ميل"'],
  ['"feat.manage.check3": "CNIC registered"', '"feat.manage.check3": "CNIC رجسٽر"'],
  ['"feat.manage.check4": "Bank account linked"', '"feat.manage.check4": "بينڪ اکائونٹ جوڑيل"'],
  ['"feat.manage.programName": "Kisaan Support Program"', '"feat.manage.programName": "ڪسان سپورٽ پروگرام"'],
  ['"feat.manage.readyBadge": "75% ready"', '"feat.manage.readyBadge": "75% تيار"'],
  ['"feat.manage.carbonCode": "F·13 · Sustainability"', '"feat.manage.carbonCode": "F·13 · پائيداري"'],
  ['"feat.manage.carbonTitle": "Green practice rewards"', '"feat.manage.carbonTitle": "سائواڙي عمل جا انعام"'],
  ['"feat.manage.creditLabel": "Credit value / yr"', '"feat.manage.creditLabel": "ڪريڊٽ قيمت / سال"'],
  ['"feat.manage.forumCode": "F·14 · Community"', '"feat.manage.forumCode": "F·14 · community"'],
  ['"feat.manage.expertBadge": "Expert verified answer"', '"feat.manage.expertBadge": "ماہر جي تائيد جواب"'],
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
console.log(`Features: ${ok} replaced, ${fail} not found.`);
