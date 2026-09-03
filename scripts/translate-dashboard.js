const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  ['"app.dashboard.greeting": "Hello, {name}"', '"app.dashboard.greeting": "سلام، {name}"'],
  ['"app.dashboard.aria.profileMenu": "Profile menu"', '"app.dashboard.aria.profileMenu": "پروفائل مينيو"'],
  ['"app.dashboard.welcomeEyebrow": "Welcome to Agropioo"', '"app.dashboard.welcomeEyebrow": "Agropioo ۾ خوش آمدید"'],
  ['"app.dashboard.welcomeTitle": "Start With Your First Farm."', '"app.dashboard.welcomeTitle": "پنھن پہلي فارم سان شروع ڪريو."'],
  ['"app.dashboard.addFirstFarm": "Add your first farm"', '"app.dashboard.addFirstFarm": "پنھن پہلي فارم شامل ڪريو"'],
  ['"app.dashboard.badge.today": "Today"', '"app.dashboard.badge.today": "اڄ"'],
  ['"app.dashboard.carryToField": "Carry it to the field"', '"app.dashboard.carryToField": "فيليڊ تي وڌو"'],
  ['"app.dashboard.askAdvisor": "Ask the advisor"', '"app.dashboard.askAdvisor": "مشاور کي پڇو"'],
  ['"app.dashboard.fullForecast": "Full forecast"', '"app.dashboard.fullForecast": "پورو اَنuman"'],
  ['"app.dashboard.seasonTipBadge": "Season tip"', '"app.dashboard.seasonTipBadge": "موسم جي ٽپ"'],
  ['"app.dashboard.alertsHeading": "Alerts"', '"app.dashboard.alertsHeading": "اطلاعات"'],
  ['"app.dashboard.viewAllAlerts": "View all alerts"', '"app.dashboard.viewAllAlerts": "igaret اطلاعات ڏيکاريو"'],
  ['"app.dashboard.noAlerts": "No alerts today — your crops are calm."', '"app.dashboard.noAlerts": "اڄ اطلاعات نه آهن — توھان جا ٻج اَرام آهي."'],
  ['"app.dashboard.severity.critical": "Critical"', '"app.dashboard.severity.critical": "شخصي"'],
  ['"app.dashboard.severity.watch": "Watch"', '"app.dashboard.severity.watch": "ڇاڻو"'],
  ['"app.dashboard.severity.info": "Info"', '"app.dashboard.severity.info": "معلومات"'],
  ['"app.dashboard.languageLabel": "Language"', '"app.dashboard.languageLabel": "ڀاڱو"'],
  ['"app.dashboard.weatherNoLocation": "Weather data will appear here once your farm location is set."', '"app.dashboard.weatherNoLocation": "موسم ڊيٽا هِتي نظر اچي جڇھن فارم جي جڳھ سيٽ ٿي وڃي."'],
  ['"app.dashboard.weatherYourArea": "Your area"', '"app.dashboard.weatherYourArea": "توھان جو علاقو"'],
  ['"app.dashboard.quickActionsHeading": "Quick actions"', '"app.dashboard.quickActionsHeading": "تيز عمل"'],
  ['"app.dashboard.cropDoctor": "Crop doctor"', '"app.dashboard.cropDoctor": "ٻج جو ڊاڪٽر"'],
  ['"app.dashboard.detectTitle": "Spot disease before it spreads"', '"app.dashboard.detectTitle": "۽يٽ کان پاڻ بيماري پڇو"'],
  ['"app.dashboard.recommendCrops": "Crop recommendation"', '"app.dashboard.recommendCrops": "ٻج جي سفارش"'],
  ['"app.dashboard.recommendCropsBody": "Get personalised crop suggestions based on your soil, weather, and location."', '"app.dashboard.recommendCropsBody": "توھان جي مٹي، موسم، ۽ جڳھ تي مبني شخصي ٻج جا تجويز حاصل ڪريو."'],
  ['"app.dashboard.myFarms": "My farms"', '"app.dashboard.myFarms": "مون جا فارم"'],
  ['"app.dashboard.addFarm": "Add farm"', '"app.dashboard.addFarm": "فارم شامل ڪريو"'],
  ['"app.dashboard.viewAllFarms": "View all farms"', '"app.dashboard.viewAllFarms": "ڳنڍا فارم ڏيکاريو"'],
  ['"app.dashboard.health.good": "Good"', '"app.dashboard.health.good": "ڇوSortable"'],
  ['"app.dashboard.health.watch": "Watch"', '"app.dashboard.health.watch": "ڇاڻو"'],
  ['"app.dashboard.setupChecklist": "Set up your farm"', '"app.dashboard.setupChecklist": "فارم سيٽ ڪريو"'],
  ['"app.dashboard.demoFooter": "Demo build · sample data only"', '"app.dashboard.demoFooter": "ڊيمو بلڊ · نمونا ڊيٽا ڪل"'],
  ['"app.dashboard.pricesWidgetNoTracked": "Track crops to see prices here"', '"app.dashboard.pricesWidgetNoTracked": "قيمت هتي ڏيکارڻ لاءِ ٻجTrack ڪريو"'],
  ['"app.dashboard.pricesWidgetPerMaund": "per maund"', '"app.dashboard.pricesWidgetPerMaund": "في ماڻھ"'],
  ['"app.dashboard.pricesWidgetView": "View prices"', '"app.dashboard.pricesWidgetView": "قيمت ڏيکاريو"'],
  ['"app.dashboard.pricesWidgetTitle": "Market prices"', '"app.dashboard.pricesWidgetTitle": "بازار جا قيمت"'],
  ['"app.dashboard.demo.todayLabel": "Sunday, 23 Aug"', '"app.dashboard.demo.todayLabel": "اتوار، 23 آگسٽ"'],
  ['"app.dashboard.demo.location": "Multan, Punjab"', '"app.dashboard.demo.location": "ملتان، پنجاب"'],
  ['"app.dashboard.demo.advisoryCrop": "Wheat"', '"app.dashboard.demo.advisoryCrop": "گندم"'],
  ['"app.dashboard.demo.advisoryStage": "Vegetative"', '"app.dashboard.demo.advisoryStage": "نباتاتي"'],
  ['"app.dashboard.demo.advisoryAction": "Delay irrigation today"', '"app.dashboard.demo.advisoryAction": "اڄ آبياري ر heels"'],
  ['"app.dashboard.demo.seasonAction": "Walk your fields before the rains arrive"', '"app.dashboard.demo.seasonAction": "پانهَن کان پاڻ پنھن جي فيلڊن ۾ هاتو ڪريو"'],
  ['"app.dashboard.demo.weatherLocation": "Multan"', '"app.dashboard.demo.weatherLocation": "ملتان"'],
  ['"app.dashboard.demo.weatherCondition": "Cloudy"', '"app.dashboard.demo.weatherCondition": "ابرآلود"'],
  ['"app.dashboard.demo.farm1Name": "Khalilpur Farm"', '"app.dashboard.demo.farm1Name": "خاليلپور فارم"'],
  ['"app.dashboard.demo.farm1Location": "Khalilpur, Multan"', '"app.dashboard.demo.farm1Location": "خاليلپور، ملتان"'],
  ['"app.dashboard.demo.farm1Crops": "Wheat"', '"app.dashboard.demo.farm1Crops": "گندم"'],
  ['"app.dashboard.demo.farm1Stage": "Vegetative"', '"app.dashboard.demo.farm1Stage": "نباتاتي"'],
  ['"app.dashboard.demo.farm2Name": "Sahiwal Plot"', '"app.dashboard.demo.farm2Name": "ساهيول پلاٽ"'],
  ['"app.dashboard.demo.farm2Location": "Depalpur Road, Sahiwal"', '"app.dashboard.demo.farm2Location": "دپالپور روڊ، ساهيول"'],
  ['"app.dashboard.demo.farm2Crops": "Cotton"', '"app.dashboard.demo.farm2Crops": "ڪپاس"'],
  ['"app.dashboard.demo.farm2Stage": "Squaring"', '"app.dashboard.demo.farm2Stage": "スクエア"'],
  ['"app.dashboard.demo.farm3Name": "Chak 62 GB"', '"app.dashboard.demo.farm3Name": "چڪ 62 GB"'],
  ['"app.dashboard.demo.farm3Location": "Chak 62 GB, Faisalabad"', '"app.dashboard.demo.farm3Location": "چڪ 62 GB، فيصل آباد"'],
  ['"app.dashboard.demo.farm3Crops": "Sugarcane"', '"app.dashboard.demo.farm3Crops": "茎inha"'],
  ['"app.dashboard.demo.farm3Stage": "Tillering"', '"app.dashboard.demo.farm3Stage": "ٽيلرنگ"'],
  ['"app.dashboard.demo.checklistAdvisor": "Ask the advisor once"', '"app.dashboard.demo.checklistAdvisor": "مشاور کي هڪ ڀيِّ پڇو"'],
  ['"app.dashboard.demo.checklistDetect": "Run your first detection"', '"app.dashboard.demo.checklistDetect": "پنھن پہلي پڇو چالو ڪريو"'],
  ['"app.dashboard.demo.actionAdvisor": "Ask advisor"', '"app.dashboard.demo.actionAdvisor": "مشاور کي پڇو"'],
  ['"app.dashboard.demo.actionScan": "Scan crop"', '"app.dashboard.demo.actionScan": "ٻج اسڪين ڪريو"'],
  ['"app.dashboard.demo.actionPrices": "Check prices"', '"app.dashboard.demo.actionPrices": "قيمت چيڪ ڪريو"'],
  ['"app.dashboard.demo.actionRecord": "Add record"', '"app.dashboard.demo.actionRecord": "رڪارڊ شامل ڪريو"'],
  ['"app.dashboard.demo.actionRecommend": "Recommend crops"', '"app.dashboard.demo.actionRecommend": "ٻج جي سفارش ڪريو"'],
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
console.log(`Dashboard: ${ok} replaced, ${fail} not found.`);
