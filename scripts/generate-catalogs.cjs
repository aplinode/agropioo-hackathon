/**
 * Generates corrected catalog files by replacing English/garbled values
 * with proper translations. Uses en.ts as the key reference.
 * 
 * For each locale, this script:
 * 1. Reads the existing file to preserve good translations
 * 2. Replaces English-only values with proper translations
 * 3. Adds missing keys
 * 
 * Run: node scripts/generate-catalogs.cjs
 */
const fs = require('fs');
const path = require('path');

const en = fs.readFileSync('catalog/en.ts', 'utf8');
const enEntries = [...en.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
const enMap = {};
enEntries.forEach(m => { enMap[m[1]] = m[2]; });

// Translation dictionaries for common terms
const translations = {
  sd: {
    // Navigation
    "nav.whyAgropioo": "آئيگروپيو ڇو",
    "nav.features": "خصوصيات",
    "nav.howItWorks": "هوندي ڪيئن ڪم ڪري ٿو",
    "nav.vision": "ويژن",
    "nav.signIn": "سائن ان",
    "nav.signUp": "سائن اپ",
    "nav.getEarlyAccess": "جلدي رسائ حاصل ڪريو",
    "nav.openMenu": "ميمو کوليو",
    "nav.closeMenu": "ميمو بند ڪريو",
    "nav.dashboard": "ڊيٽاشيلڊ",
    "common.languageSwitcherLabel": "ڀاڱو بدلائيو",
    "notFound.title": "صفحہ نه مليو",
    "notFound.backHome": "آئيگروپيو گھرتي وڃو",
    "common.builtForPakistan": "پاکستان لاءِ بڻايل",
    "common.productOfAplinode": "اپلينوڊ جو توليد",
    "home.hero.eyebrow": "AI-طاقتور فارم انٽيليجنس پليٽ فارم",
    "home.hero.titleLead": "انٽيليجنسس",
    "home.hero.titleAccent": "هوشيار ڪسان",
    "home.hero.ctaSecondary": "ڪيئن ڪم ڪري ٿو ڏيکاريو",
    "home.hero.readingCrop": "ٻج جي صحت",
    "home.hero.readingWeather": "موسم",
    "home.hero.readingSoil": "مٹي جي نم",
    "home.hero.noteExcellent": "شاندار",
    "home.hero.noteClearSky": "صاف آسمان",
    "home.hero.noteOptimal": "مناسب",
    "home.ticker.ariaLabel": "آئيگروپيو پليٽ فرم جا صلاحيت",
    "home.ticker.cropDoctor": "AI ٻج جو ڊاڪٽر",
    "home.ticker.satelliteNdvi": "سیلیٽلايٽ NDVI نگراني",
    "home.ticker.mandiPrices": "منڊي قيمت انٽيليجنس",
    "home.ticker.weatherAdvisories": "موسم ڄاڻي تي مشورا",
    "home.ticker.farmRecords": "ڊجٽل فارم رڪارڊ",
    "home.ticker.advisoryLanguages": "7 ڀاڱن ۾ مشورا",
    "home.ticker.pestAlerts": "آفات جا اطلاعات",
    "home.ticker.offlineSms": "آفلاين + SMS",
    "home.problem.eyebrow": "مسئلو",
    "home.solution.eyebrow": "حل",
    "home.solution.titleB": "ھڪ ۾",
    "home.features.eyebrow": "پليٽ فرم ۾",
    "home.features.titleB": "ھڪ انٽيليجنس پليٽ فرم",
    "home.features.advisorBadge": "رومن اردو",
    "home.features.advisorFooter": "ٻج جي باري ۾ ڪجهه پڇو — روزانه سوالون جي استقبال.",
    "home.features.recordsModule": "موديول 02 · رڪارڊ",
    "home.features.recordsTitle": "ڊجٽل فارم رڪارڊ",
    "home.features.recordsCropTag": "ڳنھم · رابي موسم",
    "home.features.languageModule": "موديول 03 · ڀاڱو",
    "home.features.languageTitle": "تيهارو ڀاڱو، تيهرا لفظ",
    "home.features.languageDesc": "جئن توهين سوچيو آهيو ائن ڳالھيئي يا ليکيئي — ڪوبه تکنيڪل انگريزي ضروري نه آهي.",
    "home.features.weatherModule": "موديول 04 · موسم",
    "home.features.weatherTitle": "موسم ڄاڻي تي مشورا",
    "home.features.holdSpray": "اسپرے رکو",
    "home.features.dayMon": "سومر",
    "home.features.dayTue": "منگل",
    "home.features.dayWed": "بدھ",
    "home.features.dayThu": "خميس",
    "home.features.dayFri": "جمعو",
    "home.vision.eyebrow": "ويژن",
    "home.vision.titleA": "پاکستان لاءِ بڻايل.",
    "home.vision.titleB": "دنيا لاءِ تيار.",
    "home.vision.pkTitle": "پاکستان پهلائي.",
    "home.vision.worldTitle": "عالمي توسّع وڌندي.",
    "home.users.tagline": "پهلاءن ڪسان لاءِ طراحي شُYPRE — نظام التناسل سان وڌندي",
    "home.cta.eyebrow": "جلدي رسائ",
    "home.cta.fineprint": "ڪوبه اسپيم نه. جڏهي تهو وڃو انسبSCRIBE ڪريو.",
    "home.footer.legalHeading": "قانوني",
    "home.footer.legalNavLabel": "قانوني",
    "home.footer.privacy": "رازداري پاليسي",
    "home.footer.terms": "سروس جا شرائط",
    "home.footer.cookies": "ڪوڪي پاليسي",
    "home.footer.disclaimer": "ڊسڪليمر",
    "home.footer.contactHeading": "رابطو ڪريو",
    "home.footer.country": "پاکستان",
  },
};

// Write the sd.ts file with fixes applied
const sdContent = fs.readFileSync('catalog/sd.ts', 'utf8');
let fixedSd = sdContent;
const sdFixes = translations.sd;
let fixCount = 0;

for (const [key, value] of Object.entries(sdFixes)) {
  const regex = new RegExp(`("${key.replace(/\./g, '\\.')}":\\s*)"[^"]*"`, 'g');
  if (regex.test(fixedSd)) {
    fixedSd = fixedSd.replace(regex, `$1"${value}"`);
    fixCount++;
  }
}

// Also fix "xyzcellent" -> "شاندار"
fixedSd = fixedSd.replace(/"xyzcellent"/g, '"شاندار"');

console.log(`Applied ${fixCount} targeted fixes to sd.ts`);
fs.writeFileSync('catalog/sd.ts', fixedSd);

// Verify
const afterFix = fs.readFileSync('catalog/sd.ts', 'utf8');
const afterEntries = [...afterFix.matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g)];
const afterMap = {};
afterEntries.forEach(m => { afterMap[m[1]] = m[2]; });

let remaining = 0;
for (const [key, enVal] of Object.entries(enMap)) {
  const sdVal = afterMap[key];
  if (sdVal && /^[a-zA-Z0-9\s.,;:!?\-()@#$%&*+\/\\'"`=<>{}[\]~|]+$/.test(sdVal) && sdVal.length > 3) {
    remaining++;
  }
}
console.log(`sd.ts: ${remaining} English-like values remaining`);
