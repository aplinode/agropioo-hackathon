const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  ['"app.weather.pageTitle": "Weather Advisory"', '"app.weather.pageTitle": "موسم مشورو"'],
  ['"app.weather.eyebrow": "Weather"', '"app.weather.eyebrow": "موسم"'],
  ['"app.weather.todayAdvisory": "Today\'s advisory"', '"app.weather.todayAdvisory": "اڄ جو مشورو"'],
  ['"app.weather.growthStage": "Growth stage"', '"app.weather.growthStage": "وڌ جو مرحلو"'],
  ['"app.weather.severity.info": "Info"', '"app.weather.severity.info": "معلومات"'],
  ['"app.weather.severity.warning": "Warning"', '"app.weather.severity.warning": "خبرداري"'],
  ['"app.weather.severity.critical": "Critical"', '"app.weather.severity.critical": "شخصي"'],
  ['"app.weather.forecastTitle": "7-day forecast"', '"app.weather.forecastTitle": "7-دن جو اَنuman"'],
  ['"app.weather.weatherUnavailable": "Weather data unavailable"', '"app.weather.weatherUnavailable": "موسم ڊيٽا دستياب نه آهي"'],
  ['"app.weather.weatherUnavailableBody": "Showing your last saved advice. New advice appears when the forecast returns."', '"app.weather.weatherUnavailableBody": "توھان جي حديث بچائي وئي مشورو دکھائي وئي آهي. نئون مشورو ظاهر ٿي وڃي جڇھن اَنuman واپس اچي."'],
  ['"app.weather.farmSelectorLabel": "Farm"', '"app.weather.farmSelectorLabel": "فارم"'],
  ['"app.weather.registerTitle": "Register your farm"', '"app.weather.registerTitle": "فارم رجسٽر ڪريو"'],
  ['"app.weather.registerCta": "Register a farm"', '"app.weather.registerCta": "فارم رجسٽر ڪريو"'],
  ['"app.weather.registerForm.crop": "Primary crop"', '"app.weather.registerForm.crop": "پہرو ٻج"'],
  ['"app.weather.registerForm.sowing": "Sowing date"', '"app.weather.registerForm.sowing": "ڦڙين جي تاريخ"'],
  ['"app.weather.registerForm.soil": "Soil type"', '"app.weather.registerForm.soil": "مٹي جو قسم"'],
  ['"app.weather.registerForm.irrigation": "Irrigation method"', '"app.weather.registerForm.irrigation": "آبياري جو طريقو"'],
  ['"app.weather.registerForm.soilTypes": "Clay, loam, sandy, or silt"', '"app.weather.registerForm.soilTypes": "ميتي، لوم، ريتلي، يا سلٽ"'],
  ['"app.weather.registerForm.irrigationMethods": "Drip, sprinkler, flood, or rainfed"', '"app.weather.registerForm.irrigationMethods": ".fromLTRB، اسپنڪلر، ڇيل، يا پانهَن"'],
  ['"app.weather.registerForm.save": "Save and see my advisory"', '"app.weather.registerForm.save": "بچائيو ۽ مون جو مشورو ڏيکاريو"'],
  ['"app.weather.registerForm.success": "Saved — here is your advisory"', '"app.weather.registerForm.success": "بچائي وئو — هتي توھان جو مشورو آهي"'],
  ['"app.weather.registerForm.error": "Could not save your farm details. Please try again."', '"app.weather.registerForm.error": "فارم جي تفصيل بچائي نه سکي. ٻڌي ڪوشش ڪريو."'],
  ['"app.weather.historyTitle": "Advisory history"', '"app.weather.historyTitle": "مشاوري جي تاريخ"'],
  ['"app.weather.history.empty": "No past advisories yet."', '"app.weather.history.empty": "اڃا پڏيل مشورا نه آهن."'],
  ['"app.weather.history.date": "Date"', '"app.weather.history.date": "تاريخ"'],
  ['"app.weather.history.severity": "Severity"', '"app.weather.history.severity": "شديدت"'],
  ['"app.weather.history.status": "Status"', '"app.weather.history.status": "حالت"'],
  ['"app.weather.history.status.new": "New"', '"app.weather.history.status.new": "نئون"'],
  ['"app.weather.history.status.seen": "Seen"', '"app.weather.history.status.seen": "ڏيڪيل"'],
  ['"app.weather.history.status.acted": "Acted on"', '"app.weather.history.status.acted": "عمل ٿيو"'],
  ['"app.weather.history.loadMore": "Load more"', '"app.weather.history.loadMore": "وڌيڪ لوڊ ڪريو"'],
  ['"app.weather.history.viewAll": "View full history"', '"app.weather.history.viewAll": "پوري تاريخ ڏيکاريو"'],
  ['"app.weather.detail.back": "Back to history"', '"app.weather.detail.back": "تاريخ تي واپس"'],
  ['"app.weather.detail.weatherConditions": "Weather conditions"', '"app.weather.detail.weatherConditions": "موسم جي حالت"'],
  ['"app.weather.detail.recommendation": "Recommendation"', '"app.weather.detail.recommendation": "سفارش"'],
  ['"app.weather.detail.markActed": "Mark as acted on"', '"app.weather.detail.markActed": "عمل ٿيو نشان لڳائيو"'],
  ['"app.weather.detail.markAcknowledged": "Mark as seen"', '"app.weather.detail.markAcknowledged": "ڏيڪيل نشان لڳائيو"'],
  ['"app.weather.detail.markedActed": "Marked as acted on"', '"app.weather.detail.markedActed": "عمل ٿيو نشان لڳائي وئو"'],
  ['"app.weather.detail.markedSeen": "Marked as seen"', '"app.weather.detail.markedSeen": "ڏيڪيل نشان لڳائي وئو"'],
  ['"app.weather.alerts.title": "Active alerts"', '"app.weather.alerts.title": "فعال اطلاعات"'],
  ['"app.weather.alerts.heavyRain": "Heavy rain expected — delay irrigation and protect harvested crops."', '"app.weather.alerts.heavyRain": "وڍيڪ پانهَن متوقع آهي — آبياري وڌو ۽ ڦڙيل ٻج بچائيو."'],
  ['"app.weather.alerts.frost": "Frost risk — protect sensitive crops tonight."', '"app.weather.alerts.frost": "پالو جو خطر — آج رات حساس ٻج بچائيو."'],
  ['"app.weather.alerts.extremeHeat": "Extreme heat — increase irrigation and avoid midday field work."', '"app.weather.alerts.extremeHeat": "ڍندڙ گرم — آبياري وڌو ۽ دوپاھر فيلڊ ڪم کان بچو."'],
  ['"app.weather.alerts.diseaseRisk": "High humidity favours disease — apply preventive fungicide in the dry morning window."', '"app.weather.alerts.diseaseRisk": "وڌيڪ نم بيماري لاءِ م有利 — خشک سحري ونڊو ۾ احتياطي فائINGER لاڳو ڪريو."'],
  ['"app.weather.alerts.dismiss": "Dismiss"', '"app.weather.alerts.dismiss": "بند ڪريو"'],
  ['"app.weather.alerts.noAlerts": "No active alerts right now."', '"app.weather.alerts.noAlerts": "ھاڻي فعال اطلاعات نه آهن."'],
  ['"app.weather.alerts.viewAll": "View all notifications"', '"app.weather.alerts.viewAll": "ڳنڍا اطلاعات ڏيکاريو"'],
  ['"app.weather.stages.seedling": "Seedling"', '"app.weather.stages.seedling": "ٻج"'],
  ['"app.weather.stages.vegetative": "Vegetative"', '"app.weather.stages.vegetative": "نباتاتي"'],
  ['"app.weather.stages.flowering": "Flowering"', '"app.weather.stages.flowering": "پنڌار"'],
  ['"app.weather.stages.maturation": "Maturation"', '"app.weather.stages.maturation": "پڪڻ"'],
  ['"app.weather.stages.harvestReady": "Harvest ready"', '"app.weather.stages.harvestReady": "ڦڙي تيار"'],
  ['"app.weather.stages.generic": "General"', '"app.weather.stages.generic": "عام"'],
  ['"app.weather.source.live": "Live forecast · OpenWeather"', '"app.weather.source.live": "موسم · OpenWeather"'],
  ['"app.weather.source.cached": "Last saved forecast"', '"app.weather.source.cached": "حديث بچائي وئي اَنuman"'],
  ['"app.weather.source.demo": "Sample forecast — add an API key for live data"', '"app.weather.source.demo": "نمونا اَنuman — موسم ڊيٽا لاءِ API ڪلڊ شامل ڪريو"'],
  ['"app.weather.buttons.register": "Register farm"', '"app.weather.buttons.register": "فارم رجسٽر"'],
  ['"app.weather.buttons.refresh": "Refresh"', '"app.weather.buttons.refresh": "ريفرش"'],
  ['"app.weather.errors.generic": "Something went wrong. Please try again."', '"app.weather.errors.generic": "ڪجهه خراب ٿيو. ٻڌي ڪوشش ڪريو."'],
  ['"app.weather.errors.noFarm": "Select a farm to see its advisory."', '"app.weather.errors.noFarm": "فارم جو مشورو ڏيکارڻ لاءِ فارم چونڊيو."'],
  ['"app.weather.metric.temperature": "Temperature"', '"app.weather.metric.temperature": "TEMPerature"'],
  ['"app.weather.metric.precipitation": "Precipitation"', '"app.weather.metric.precipitation": "بارش"'],
  ['"app.weather.metric.wind": "Wind"', '"app.weather.metric.wind": "هوا"'],
  ['"app.weather.metric.humidity": "Humidity"', '"app.weather.metric.humidity": "نم"'],
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
console.log(`Weather: ${ok} replaced, ${fail} not found.`);
