const fs = require('fs');

const sdFixes = {
  "home.features.advisorReplyCause1": "پاني جو تناؤ",
  "home.features.advisorReplyCause2": "نائٹروجن جي کم",
  "home.matrix.t1f1Title": "AI فصل بيماري پIntersection",
  "home.matrix.t1f1Body": "ڳاڙهي جي تصوير وڌيئي ۽ ثانیوں ۾ بيماري جو تشخيص، شدت، ۽ علاج جي تجاوزي حاصل ڪريو.",
  "home.matrix.t1f2Title": "سليگريٽ فارم نگراني",
  "home.matrix.t1f2Body": "پنھن کيتي جي حدون نشان لڳايو ۽ سنتنل-2 مفت تصویرن کان NDVI مبني فصل صحت نشاني ویکھیو.",
  "home.matrix.t1f3Title": "هوشيار موسم مشاورت",
  "home.matrix.t1f3Body": "һایپرلوکل پیش بینیاں پنھن فصل ۽ نشوونما کي م阶级 سان روزانه ڪم ۾ آنڲ سائر بنايو.",
  "home.matrix.t1f4Title": "مينڊي قيمت ٽریکر ۽ اندازهن وpyx",
  "home.matrix.t1f4Body": "AI رجحان پیش بینیاں سان قريبي بازار جا قيمتون ٽریک ڪريو ته ٽو سahi وقت فروخت ڪريو.",
  "home.matrix.t2f1Title": "علاقائي ٻولي وائس چيٽ بوٽ",
  "home.matrix.t2f2Title": "حکومتي اسکيم ڳهنٽڻ وpyx",
  "home.matrix.t2f2Body": "پنھن پروفائل داخل ڪريو ۽ هر اسکيم ویکھیو جنکي توهين لاءِ اہليت آهي، دستاويزات ۽ درخواست لنکس سان.",
  "home.matrix.t2f3Title": "فصل تجویز انجني",
  "home.matrix.t2f3Body": "توهيঁ جي مٽي، موسم، بازار جي مطالب، ۽ بجٹ لاءِ سب سان زیاده منفعت بخش ٻج هن موسم.",
  "home.matrix.t2f4Title": "فارم منفعت / نقصان حساب",
  "home.matrix.t2f5Title": "ڪمیونيتي فورم + ماهر رابطو",
  "home.matrix.t2f5Body": "سوال پوئڻي، تصویرن شیئر ڪريو، ڪسانن ۽ تاييد شدہ زراعت ماهرين کان جواب حاصل ڪريو.",
  "home.matrix.t3f1Title": "سليگريٽ تبديلي پIntersection",
  "home.matrix.t3f1Body": " slider سان سليگريٽ تصویرن کي وقت تي مخالف ویکھیو نشوونما، نقصان، يا داخلي تبديلي٩ن ٽریک ڪريو.",
  "home.matrix.t3f2Title": "AI حشرات وڌڻ جو اندازو",
  "home.matrix.t3f2Body": "موسم، فصل جي مرحborne، ۽ تاريخ تي مبني حشرات حملن کان اڳ هشدار.",
  "home.matrix.t3f3Title": "آواز پهلائين ٿي ٿل فون موڊ",
  "home.matrix.t3f4Title": "کاربن ڪريڊيٽ اندازهن وpyx",
  "home.matrix.t3f4Body": "پائیدار مشقون رڪارڊ ڪريو ۽ رضاکارانه بازارن کان کاربن ڪريڊيٽ جي قيمت انداز لڳائيو.",
  "home.matrix.t3f5Title": "غير فعال هنڊ PWA + SMS هشدار",
  "home.matrix.t3f5Body": "ميدان ۾ غير فعال هنڊ ۾ ڪم ڪري ٿو، رابطه سان سنكرو ٿي وڃي ٿو، ڊيٽا مان ٿوري هنڊ تي SMS هشدار ڏي ٿي.",
  "home.vision.pkPoint2": "اردو، پنجابي، پښتو، سنڌي، سرائيقي، بلۏچي، هندڪو",
  "home.cta.success": "توهيঁ ليست ۾ آهيو. جڏهي توهان جو علاقہ کھلي ته اسان رابطه ڪريون.",
  "hiw.hero.titleA": "چھ چھوٹا قدم.",
  "hiw.hero.titleAccent": "هوشيار موسم.",
  "hiw.route.stepLabel": "قدم {n}: {stop}",
  "hiw.setup.point1": "کڏهن هي بدلائين يا کيتي شامل ڪريو",
  "hiw.setup.point2": "ٺاڻيندڙن ۽ ڊيلرن لاءِ گھڻا فارم",
  "hiw.setup.rowCrop": "فصل",
  "hiw.setup.rowSowing": "بیج بونجھ جي تاريخ",
  "hiw.setup.rowLand": "زمين",
  "hiw.ask.titleA": "هڪ سوال داخل.",
  "hiw.ask.question": "اب پاڻ ڏيڻو چاهئې يا ٿوري وراバス؟",
  "hiw.ask.chipCrop": "فصل",
  "hiw.record.titleA": "ھن ٽو ٿپا،",
  "hiw.loop.titleA": "ڦٺائين تي ختم نه ٿي ٿو.",
  "hiw.loop.benefit1Desc": "پچھلي موسم جي بيماري، مقدارن، ۽ تاريخ هن موسم جو پهلي جواب بنايو ٿي.",
  "hiw.loop.stepLearn": "سیکھو",
  "hiw.loop.centerLoop": " لوپ",
  "hiw.loop.caption": "هر موسم، پچھلي کان بہتر",
  "feat.meta.description": "هر آئيگروپيو صلاحيت ویکھیو: AI فصل ڊاکٽر، سليگريٽ NDVI نگراني، مينڊي قيمت جو انداز، مقامي ٻولي وائس مشاورت، غير فactivex acess ۽ SMS هشدار.",
  "feat.hero.tile2Value": "+12%",
  "feat.hero.tile3Value": "0.82",
  "auth.emailPlaceholder": "تو@example.com",
};

console.log('Fixing sd.ts remaining...');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');
let count = 0;

for (const [key, value] of Object.entries(sdFixes)) {
  const regex = new RegExp(`("${key.replace(/\./g, '\\.')}":\\s*)"[^"]*"`, 'g');
  if (regex.test(sd)) {
    sd = sd.replace(regex, `$1"${value}"`);
    count++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Applied ${count} fixes`);
