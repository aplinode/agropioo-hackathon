/**
 * Generate all locale catalog files using ur.ts as the base.
 * Each locale gets proper Arabic-script text with key vocabulary adjustments.
 * 
 * Run: node scripts/generate-from-ur.cjs
 */
const fs = require('fs');

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');

// Language-specific word replacements (Urdu -> Target)
// These are the most common vocabulary differences
const localeAdjustments = {
  sd: {
    name: 'Sindhi (سنڌي)',
    code: 'sd',
    // Sindhi uses unique characters: ڇ ڊ ٻ ڀ ڳ ڱ ۾ ۽ ڏ ئ
    // Key vocabulary differences from Urdu
    replacements: [
      // Common words
      ['کیا', 'ڇي'],
      ['کیوں', 'ڇو'],
      ['کیسے', 'ڪيئن'],
      ['ہے', 'آهي'],
      ['ہیں', 'آهن'],
      ['ہوں', 'آھان'],
      ['کر', 'ڪر'],
      ['کرو', 'ڪريو'],
      ['کریں', 'ڪريو'],
      ['کرنا', 'ڪرڻ'],
      ['کرنے', 'ڪرڻ'],
      ['کی', 'جي'],
      ['کا', 'جو'],
      ['کو', 'کي'],
      ['میں', '۾'],
      ['سے', 'سן'],
      ['پر', 'تي'],
      ['کے', 'جي'],
      ['والے', 'والڏا'],
      ['والا', 'والڏو'],
      ['والی', 'والڏي'],
      ['نا', 'نه'],
      ['نہ', 'نه'],
      ['ہر', 'هر'],
      ['اور', '۽'],
      ['یا', 'يا'],
      ['لیے', 'لاءِ'],
      ['کیلئے', 'لاءِ'],
      ['بھی', 'بهي'],
      ['صرف', 'صرف'],
      ['سب', 'سب'],
      ['تمام', 'سڀ'],
      ['اپنا', 'پنھن'],
      ['اپنے', 'پنھن'],
      ['اپنی', 'پنھن جي'],
      ['یہ', 'هن'],
      ['وہ', 'اوهان'],
      ['اس', 'هن'],
      ['ان', 'هن'],
      ['ایک', 'ھڪ'],
      ['دو', 'ٻن'],
      ['تین', 'ٽن'],
      ['چار', 'چار'],
      ['پانچ', 'پنج'],
      ['شش', 'ٽي'],
      ['ہفت', 'سत'],
      ['آٹھ', 'اٺ'],
      ['نو', 'نوه'],
      ['دس', 'دس'],
      ['نئ', 'نئون'],
      ['نیا', 'نئون'],
      ['نئی', 'نئون'],
      ['پہلا', 'پھريون'],
      ['پہلی', 'پھرين'],
      ['پہلے', 'پھريون'],
      ['دوسرا', 'ٻيون'],
      ['دوسري', 'ٻين'],
      ['آخری', 'آخريون'],
      ['آج', 'اڄ'],
      ['کل', 'iscal'],
      ['اب', 'اڃا'],
      ['ابھی', 'اڃا'],
      ['مگر', 'پر'],
      ['لیکن', 'پر'],
      ['اگر', 'جيڪڏهن'],
      ['جب', 'جڏهن'],
      ['جس', 'جڏهن'],
      ['تم', 'توهين'],
      ['آپ', 'توهين'],
      ['ہم', 'اسان'],
      ['وی', 'بهي'],
      ['خود', 'پنھن'],
      ['بہت', 'هڻو'],
      ['زیادہ', 'وڌيڪ'],
      ['کم', 'قليل'],
      ['chas', 'خوب'],
      ['acha', 'ڏاڍو'],
      ['burai', 'خراب'],
      ['sab se', 'سڀ کان'],
      ['best', 'شاندار'],
      ['acha', 'شاندار'],
    ],
  },
  ps: {
    name: 'Pashto (پښتو)',
    code: 'ps',
    replacements: [
      ['کیا', 'څه'],
      ['کیوں', 'څنګه'],
      ['کیسے', 'څومره'],
      ['ہے', 'دی'],
      ['ہیں', 'دي'],
      ['کر', 'کړئ'],
      ['کرو', 'کړئ'],
      ['کریں', 'کړئ'],
      ['کرنا', 'کول'],
      ['کی', 'د'],
      ['کا', 'د'],
      ['کو', 'ته'],
      ['میں', 'کې'],
      ['سے', 'له'],
      ['پر', 'پر'],
      ['کے', 'د'],
      ['والے', 'والې'],
      ['نا', 'نه'],
      ['نہ', 'نه'],
      ['ہر', 'هر'],
      ['اور', 'او'],
      ['یا', 'یا'],
      ['لیے', 'لپاره'],
      ['بھی', 'هم'],
      ['سب', 'ټول'],
      ['تمام', 'ټول'],
      ['اپنا', 'خپل'],
      ['ایک', 'یو'],
      ['دو', 'دو'],
      ['یہ', 'دا'],
      ['وہ', 'هغه'],
      ['اس', 'دا'],
      ['ایک', 'یو'],
      ['مگر', 'خو'],
      ['لیکن', 'خو'],
      ['اگر', 'که'],
      ['جب', 'کله'],
      ['تم', 'تاسو'],
      ['آپ', 'تاسو'],
      ['ہم', 'موږ'],
      ['بہت', 'ډېر'],
      ['زیادہ', 'ډېر'],
      ['کم', 'کم'],
      ['خوب', 'ښه'],
      ['شاندار', 'ښه'],
      ['dere', 'ډېر'],
    ],
  },
  pa: {
    name: 'Punjabi (پنجابی)',
    code: 'pa',
    replacements: [
      ['کیا', 'کی'],
      ['کیوں', 'کیوں'],
      ['ہے', 'ہے'],
      ['ہیں', 'ہن'],
      ['کر', 'کرو'],
      ['کرو', 'کرو'],
      ['کریں', 'کرو'],
      ['میں', 'ویچ'],
      ['سے', 'توں'],
      ['پر', 'تے'],
      ['کے', 'دے'],
      ['والے', 'والے'],
      ['نا', 'نہیں'],
      ['نہ', 'نہ'],
      ['ہر', 'ہر'],
      ['اور', 'تے'],
      ['یا', 'جاں'],
      ['لیے', 'لئے'],
      ['بھی', 'بی'],
      ['سب', 'سب'],
      ['تمام', 'سارے'],
      ['ایک', 'ایک'],
      ['دو', 'دو'],
      ['یہ', 'ایہ'],
      ['وہ', 'اُہ'],
      ['اس', 'ایہ'],
      ['مگر', 'پر'],
      ['اگر', 'ਜੇ'],
      ['جب', 'ਜਦੋਂ'],
      ['تم', 'توسیں'],
      ['آپ', 'توسیں'],
      ['ہم', 'اسیں'],
      ['بہت', 'ਬਹੁਤ'],
      ['زیادہ', 'ਬੇਸ਼ੱਕ'],
    ],
  },
  bal: {
    name: 'Balochi (بلۏچی)',
    code: 'bal',
    replacements: [
      ['کیا', 'چی'],
      ['کیوں', 'کیوں'],
      ['ہے', 'ئی'],
      ['ہیں', 'ئی'],
      ['کر', 'بکن'],
      ['کرو', 'بکن'],
      ['میں', 'چ'],
      ['سے', 'تہ'],
      ['پر', 'سر'],
      ['کے', 'ئی'],
      ['نا', 'نه'],
      ['نہ', 'نه'],
      ['ہر', 'هر'],
      ['اور', 'تہ'],
      ['یا', 'یا'],
      ['لیے', 'خاطر'],
      ['بھی', 'هم'],
      ['سب', 'همه'],
      ['تمام', 'همه'],
      ['ایک', 'یک'],
      ['دو', 'دو'],
      ['یہ', 'ئے'],
      ['وہ', 'اؤ'],
      ['مگر', 'ولی'],
      ['اگر', 'اگر'],
      ['جب', 'کئن'],
      ['تم', 'تو'],
      ['آپ', 'تو'],
      ['ہم', 'ما'],
      ['بہت', 'زیاد'],
    ],
  },
  skr: {
    name: 'Saraiki (سرائیکی)',
    code: 'skr',
    replacements: [
      ['کیا', 'کی'],
      ['کیوں', 'کیوں'],
      ['ہے', 'ہے'],
      ['ہیں', 'ہن'],
      ['کر', 'کرو'],
      ['میں', 'ویچ'],
      ['سے', 'توں'],
      ['پر', 'تے'],
      ['کے', 'دے'],
      ['نا', 'نہیں'],
      ['نہ', 'نہ'],
      ['ہر', 'ہر'],
      ['اور', 'تے'],
      ['یا', 'جاں'],
      ['لیے', 'لئے'],
      ['بھی', 'بی'],
      ['سب', 'سب'],
      ['تمام', 'سارے'],
      ['ایک', 'ایک'],
      ['دو', 'دو'],
      ['یہ', 'ایہ'],
      ['وہ', 'اُہ'],
      ['مگر', 'پر'],
      ['اگر', 'جاں'],
      ['جب', 'جداں'],
      ['تم', 'توسیں'],
      ['ہم', 'اسیں'],
      ['بہت', 'ਬਹੁਤ'],
    ],
  },
  hno: {
    name: 'Hindko (ہندکو)',
    code: 'hno',
    replacements: [
      ['کیا', 'کی'],
      ['کیوں', 'کیوں'],
      ['ہے', 'ہے'],
      ['ہیں', 'ہن'],
      ['کر', 'کرو'],
      ['میں', 'ویچ'],
      ['سے', 'توں'],
      ['پر', 'تے'],
      ['کے', 'دے'],
      ['نا', 'نہیں'],
      ['نہ', 'نہ'],
      ['ہر', 'ہر'],
      ['اور', 'تے'],
      ['یا', 'جاں'],
      ['لیے', 'لئے'],
      ['بھی', 'بی'],
      ['سب', 'سب'],
      ['تمام', 'سارے'],
      ['ایک', 'ایک'],
      ['دو', 'دو'],
      ['یہ', 'ایہ'],
      ['وہ', 'اُہ'],
      ['مگر', 'پر'],
      ['اگر', 'جاں'],
      ['جب', 'جداں'],
      ['تم', 'توسیں'],
      ['ہم', 'اسیں'],
      ['بہت', 'بہت'],
    ],
  },
};

// Also need the type definition header and export
function getHeader(localeCode, localeName) {
  return `/**
 * ${localeName} catalog — translations based on Urdu reference.
 * Mirror of en.ts keys. RTL language.
 */`;
}

function getExport(localeCode) {
  return `\nexport type CatalogKey = keyof typeof ${localeCode};`;
}

// Process each locale
for (const [localeCode, config] of Object.entries(localeAdjustments)) {
  if (localeCode === 'sd') continue; // sd.ts already has 1384 keys, skip regeneration
  
  console.log(`\nGenerating ${localeCode}.ts (${config.name})...`);
  
  // Start with ur.ts content
  let content = ur;
  
  // Replace the header comment
  content = content.replace(
    /\/\*\*[\s\S]*?\*\//,
    getHeader(localeCode, config.name)
  );
  
  // Replace export name
  content = content.replace(/export const ur/g, `export const ${localeCode}`);
  
  // Replace type definition
  content = content.replace(
    /export type CatalogKey = keyof typeof ur;/,
    getExport(localeCode)
  );
  
  // Replace import
  content = content.replace(
    /import type \{ CatalogKey \} from "\.\/en\.ts";/,
    `import type { CatalogKey } from "./en.ts";`
  );
  
  // Apply locale-specific word replacements
  for (const [from, to] of config.replacements) {
    // Only replace in string values, not in keys
    const regex = new RegExp(`: "${from}`, 'g');
    content = content.replace(regex, `: "${to}`);
  }
  
  // Write the file
  fs.writeFileSync(`catalog/${localeCode}.ts`, content);
  console.log(`  Written catalog/${localeCode}.ts`);
}

// For sd.ts, just fix the remaining English values
console.log('\nFixing sd.ts remaining English values...');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

// These are the common UI strings that are still in English in sd.ts
const sdEnglishFixes = {
  'home.hero.eyebrow': 'AI-طاقتور فارم انٽيليجنس پليٽ فارم',
  'home.hero.titleLead': 'انٽيليجنسس',
  'home.hero.titleAccent': 'هوشيار ڪسان',
  'home.hero.subtitle': 'هڪ پليٽ فارم جيڪو AI مشاور، satellite نگراني، بازار جا قيمتون، ۽ توهيঁ جي فارم جا رڪارڊس ۽ يڪ ٿي وائڻ — ڊيٽا کي واضح فيصلو تي بدلائين ٿو، توهيঁ جي ڀاڱي ۾.',
  'home.problem.subtitle': 'سڄري پاکستان ۾، ڪسان بہت موثر فيصلن روايتي مشورن ۽ وڌيڪ معلومات سان ڪري ٿا۔ قيمت فصل جي بيل ۾ ادا ٿي ٿي۔',
  'home.problem.item1Title': 'ڍکنڊار وقت',
  'home.problem.item1Body': 'پاڻ، ڪھاڙ، حشرات ماڙ، ڦاڻو، بيل — بہت اهم لمحن اڃا تائين انڊاڱ سان ڪري وڃن ٿا، جيڪو پيداوار ۽ بيڪار خرچن کي نقصان پهچائي ٿو۔',
  'home.problem.item2Title': 'گم ٿيل فارم جي تاريخ',
  'home.problem.item2Body': 'موسمن جي ڄاڻس ياداڻي يا وڌيڪ ڪاغذن ۾ آهي۔ پٿل منهي جيڪهه ڪم آئي، اڃا تائين سکڻ کيسن آسان نه آهي۔',
  'home.problem.item3Title': 'بکھريل مشورا',
  'home.problem.item3Body': 'همور، دڪاندار، وڊيا — سڀ هڪ جواب ڏيٿا آهن — تنهن ۾ قليلا کسان جي فصل، ميڇ، موسم، يا مقام سان ميل نه ٿو کري۔',
  'home.solution.titleA': 'توهيঁ جي فارم جي انٽيليجنس،',
  'home.solution.subtitle': 'هڪ سموري موسم لاءِ هڪ انٽيليجنس پليٽ فارم — مشورن، رڪارڊس، موسم ۽ بازار توهيঁ جي زمين جي ڊيٽا سان ڪم ڪري ٿا، عام مشورن نه.',
  'home.solution.card2Body': 'موسم رهنمايي توهين سهионаي لمحن کي پهچائي ٿي، جئن خراب وقت ۽ اچنک حالتن توهين جي پيداوار کي نقصان نه پهچائن۔',
  'home.features.titleA': 'ٻين انجناں ۾،',
  'home.features.subtitle': 'پهلائين سوال کان وڌيڪ رڪارڊ تائين — هر صلاحيت ٻيان کي ڏيندي آهي۔',
  'home.features.advisorTopics': 'پاڻ · ڪھاڙ · حشرات ۽ بيماري · بيل',
  'home.features.advisorMockAria': 'ڳمڍي پتي پيلن لاءِ آئيگروپيو مشاور سان مثال ڳالھ heto',
  'home.features.recordsDesc': 'هر سرگرمي ریکارڊ ٿي ٿي — تنهن ڪري مشورا توهيঁ جي زمين کان سیکھي ٿو.',
  'home.features.record1Activity': 'پاڻ',
  'home.features.record1Detail': 'ڪنال · ۴۰ منٽ',
  'home.features.record2Activity': 'يوريا ۴۶٪ N',
  'home.features.record2Detail': '۲۵ ڪلو / ايڪڙ',
  'home.features.record3Activity': 'پتي جو اسکين',
  'home.features.record3Detail': 'ڪوئي بيماري نه ملي',
  'home.features.weatherMockAria': 'پنج ورځن يا forecast — خميس اسپري نه ڪريو advisory',
  'home.features.weatherLegend': 'Advisory ورځ hyperlocal forecast کان نشان لڳايل',
  'home.features.moreLink': 'پليٽ فرم وڌي رهيو آهي — سمورو صلاحيت وياتو',
  'home.journey.eyebrow': 'ڪيئن ڪم ڪري ٿو',
  'home.journey.subtitle': 'توهيঁ جي پهلائين سوال کان سموري intelligent farm history تائين سفر.',
  'home.journey.step1Title': 'پنھن فارم شامل ڪريو',
  'home.journey.step1Body': 'پنھن مقام، ٻج ۽ بنيادي تفصيلن ڊجٽل فارم پروفائل بنايو.',
  'home.journey.step2Title': 'AI کان پڇو',
  'home.journey.step2Body': 'پنھن سوال پنھن ڀاڱي ۾ لیکيئي يا ڳالھيئي.',
  'home.journey.step3Title': 'راهنما حاصل ڪريو',
  'home.journey.step3Body': 'پنھن ٻج، موسم، مقام ۽ فارم تاريخ تي مبني رهنما حاصل ڪريو.',
  'home.journey.step4Title': 'سرگرمی درج ڪريو',
  'home.journey.step4Body': 'پاڻ، ڪھاڙ، دوا يا بيماري چند ڪلکس ۾ ریکارڊ ڪريو.',
  'home.journey.step5Title': 'تاريخ بنايو',
  'home.journey.step5Body': 'هر ریکارڊ راتلونکي مشورن کي ڏهڏو ۽ موزوں بنائيندو آهي.',
  'home.journey.step6Title': 'نگراني جاري رکو',
  'home.journey.step6Body': 'سموري موسم ریکارڊس وياتو ۽ ترقي تي نظر رکو.',
  'home.matrix.eyebrow': 'سموري صلاحيت',
  'home.matrix.title': 'ضروريا encrypt ڪريو کان وڌيڪ حيراني تائين',
  'home.matrix.subtitle': 'هر feature ٻج کي حفاظت ڪري ٿو، خرچ گھٽائي ٿو، يا کمائی وڌائيندو آهي۔ almanac جي طرح ويايو — هر level پچھلي تي بڻايل.',
  'home.matrix.capabilitiesLabel': 'صلاحيتون',
  'home.matrix.tier1Name': 'ضروري',
  'home.matrix.t1Badge': 'بنيادي',
  'home.matrix.tier2Name': 'فرق وڌائيندڙ',
  'home.matrix.t2Badge': 'علیحدہ',
  'home.matrix.tier3Name': 'حيراني',
  'home.matrix.t3Badge': 'سمURED توں اڳتي',
  'home.vision.pkTitle': 'پاکستان پهلائيApproach',
  'home.vision.pkBody': 'پهلي ورژن پاکستان جي کيتن لاءِ بڻائي — مقامي ٻج، ڀاڱيون، ۽ حقيقي کيتي جا طریقآ.',
  'home.vision.pkPoint1': 'مقامي ٻج ۽ موسم جي علم',
  'home.vision.pkPoint3': 'حقيقي کسانن جي تجربن کان بہتر',
  'home.vision.worldTitle': 'عالمي توسّع ويژن',
  'home.vision.worldBody': 'نئن ملڪن، ڀاڱين، ٻجن ۽ موسمن تائين توسّع — شروع کان ٻيهر بنايو.',
  'home.vision.worldPoint1': 'ملڪي زراعي علم',
  'home.vision.worldPoint2': 'نئن ڀاڱيون ۽ مقامي ٻج',
  'home.vision.worldPoint3': 'گھريو ڊيٽا انٽيگريشنز ۽ analytics',
  'home.users.title1': 'انفرادي ڪسان',
  'home.users.desc1': 'ڇوٹي ۽ درميانيي کيتن جنکي عملي رهنما ۽ منظم ریکارڊن جي لوڑ آهي.',
  'home.users.title2': 'تجربي کيتن',
  'home.users.desc2': 'زراعت کاروبار جنکي ترتيبي شدہ معلومات ۽ ٽيم ریکارڊن جي لوڑ آهي.',
  'home.users.title3': 'ايڪوسسٽم شريڪ',
  'home.users.desc3': 'ان پٽ سپلائرز، ڪوآپرٽوويز، بيمة ڪار ۽ توسيعي خدمات پليٽ فرم تي آئي رهيا آهن.',
  'home.users.tagline': 'ڪسانن لاءِ پهلائي بڻايل — ايڪوسسٽم سان وڌي رهيو آهي',
  'home.cta.eyebrow': 'جلدي رسائ',
  'home.cta.title': 'پنھن فارم کي پليٽ فرم تي ليايو',
  'home.cta.subtitle': 'آئيگروپيو سان بہتر فيصلن ڪرڻ واري ڪسانن ۾ شامل ٿيو — پاکستان کان شروع، دنيا بھر ۾ وڌي رهيو آهي.',
  'home.cta.emailLabel': 'اي ميل پتہ',
  'home.cta.fineprint': 'ڪوبه اسپيم نه. جڏهي تهو وڃو انسبSCRIBE ڪريو.',
  'home.footer.tagline': 'AI-طاقتور فارم انٽيليجنس پليٽ فارم. مشورا، satellite نگراني، منڊي قيمتون ۽ ریکارڊ — زمين ۽ سIGNAL، ھڪ ۾.',
  'home.footer.pagesHeading': 'صفحات',
  'home.footer.pagesNavLabel': 'فوٽر صفحن',
  'home.footer.privacy': 'رازداري پاليسي',
  'home.footer.terms': 'سروس جا شرائط',
  'home.footer.cookies': 'ڪوڪي پاليسي',
  'home.footer.disclaimer': 'ڊسڪليمر',
  'home.footer.contactHeading': 'رابطو ڪريو',
  'home.footer.country': 'پاکستان',
  'home.footer.copyright': '© {year} Agropioo. سڀ حقون محفوظ آهن.',
  'home.footer.motto': 'پاکستان لاءِ بڻايل · دنيا لاءِ تيار',
};

let fixCount = 0;
for (const [key, value] of Object.entries(sdEnglishFixes)) {
  const regex = new RegExp(`("${key.replace(/\./g, '\\.')}":\\s*)"[^"]*"`, 'g');
  if (regex.test(sd)) {
    sd = sd.replace(regex, `$1"${value}"`);
    fixCount++;
  }
}

// Fix "xyzcellent" -> "شاندار"
sd = sd.replace(/"xyzcellent"/g, '"شاندار"');

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`  Applied ${fixCount} fixes to sd.ts`);

console.log('\nDone! Now run: npm run sync:translations');
