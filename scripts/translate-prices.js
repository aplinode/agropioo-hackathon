const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  ['"app.prices.globalSearchViewPrices": "View prices"', '"app.prices.globalSearchViewPrices": "قيمت ڏيکاريو"'],
  ['"app.prices.globalSearchNoResults": "No results found"', '"app.prices.globalSearchNoResults": "ڪوئي نتيجو نه مليو"'],
  ['"app.prices.globalSearchMandis": "Markets"', '"app.prices.globalSearchMandis": "بازار"'],
  ['"app.prices.globalSearchCrops": "Crops"', '"app.prices.globalSearchCrops": "ٻج"'],
  ['"app.prices.globalSearchPlaceholder": "Search crops or markets..."', '"app.prices.globalSearchPlaceholder": "ٻج يا بازار پڇو..."'],
  ['"app.prices.eyebrow": "Mandi prices"', '"app.prices.eyebrow": "منڊي جا قيمت"'],
  ['"app.prices.title": "Know the rate before you sell"', '"app.prices.title": "وڌڻ کان پاڻ قيمت ڄاڻو"'],
  ['"app.prices.selectCrop": "Select crop"', '"app.prices.selectCrop": "ٻج چونڊيو"'],
  ['"app.prices.searchPlaceholder": "Search crop or mandi across Pakistan"', '"app.prices.searchPlaceholder": "ٻج يا منڊي پڇو پاکستان ۾"'],
  ['"app.prices.noData": "No price data available"', '"app.prices.noData": "قيمت جو ڊيٽا دستياب نه آهي"'],
  ['"app.prices.updatedToday": "Updated today"', '"app.prices.updatedToday": "اڄ اپڊيٽ ٿيو"'],
  ['"app.prices.marketHoliday": "Mandi closed / market holiday"', '"app.prices.marketHoliday": "منڊي بند / بازار جي چھڏي"'],
  ['"app.prices.perMaund": "/ Maund"', '"app.prices.perMaund": "/ ماڻھ"'],
  ['"app.prices.bestPrice": "Best price"', '"app.prices.bestPrice": "بهترين قيمت"'],
  ['"app.prices.hold": "Hold"', '"app.prices.hold": "روکو"'],
  ['"app.prices.sell": "Sell"', '"app.prices.sell": "وڌو"'],
  ['"app.prices.recommendationHold": "Hold for a better price"', '"app.prices.recommendationHold": "بهترين قيمت لاءِ روکو"'],
  ['"app.prices.recommendationSell": "Sell soon"', '"app.prices.recommendationSell": "جlds وڌو"'],
  ['"app.prices.volatilityWarning": "High volatility / low data"', '"app.prices.volatilityWarning": "وڌيڪ اُڏهييال / گهٽ ڊيٽا"'],
  ['"app.prices.predictionTitle": "14-day price forecast"', '"app.prices.predictionTitle": "14-دن جو قيمت اَنuman"'],
  ['"app.prices.historyTitle": "Price history"', '"app.prices.historyTitle": "قيمت جي تاريخ"'],
  ['"app.prices.range1M": "1 month"', '"app.prices.range1M": "1 مھينو"'],
  ['"app.prices.range3M": "3 months"', '"app.prices.range3M": "3 مھينا"'],
  ['"app.prices.range6M": "6 months"', '"app.prices.range6M": "6 مھينا"'],
  ['"app.prices.range12M": "1 year"', '"app.prices.range12M": "1 سال"'],
  ['"app.prices.setAlert": "Set price alert"', '"app.prices.setAlert": "قيمت جو اطلاع سيٽ ڪريو"'],
  ['"app.prices.editAlert": "Edit alert"', '"app.prices.editAlert": "اطلاع م代 Edit ڪريو"'],
  ['"app.prices.saveAlert": "Save alert"', '"app.prices.saveAlert": "اطلاع بچائيو"'],
  ['"app.prices.cancel": "Cancel"', '"app.prices.cancel": "منسوخ"'],
  ['"app.prices.alertCrop": "Crop"', '"app.prices.alertCrop": "ٻج"'],
  ['"app.prices.alertMandi": "Mandi"', '"app.prices.alertMandi": "منڊي"'],
  ['"app.prices.alertMandiOptional": "Mandi (optional)"', '"app.prices.alertMandiOptional": "منڊي (اختياري)"'],
  ['"app.prices.alertStatus": "Status"', '"app.prices.alertStatus": "حالت"'],
  ['"app.prices.targetPrice": "Target price (PKR / Maund)"', '"app.prices.targetPrice": "قيمت (PKR / ماڻھ)"'],
  ['"app.prices.alertActive": "Active"', '"app.prices.alertActive": "فعال"'],
  ['"app.prices.alertPaused": "Paused"', '"app.prices.alertPaused": "روکيل"'],
  ['"app.prices.deleteAlert": "Delete alert"', '"app.prices.deleteAlert": "اطلاع ڊليٽ ڪريو"'],
  ['"app.prices.fallbackBanner": "Set your farm location to see prices from your district automatically."', '"app.prices.fallbackBanner": "فارم جي جڳھ سيٽ ڪريو ته ضلع کان قيمت خودڪار طور تي نظر اڃن."'],
  ['"app.prices.comparisonTitle": "Compare markets"', '"app.prices.comparisonTitle": "بازار جي ترقي ڪريو"'],
  ['"app.prices.market": "Market"', '"app.prices.market": "بازار"'],
  ['"app.prices.modalPrice": "Modal price"', '"app.prices.modalPrice": "Mujawana قيمت"'],
  ['"app.prices.minPrice": "Min price"', '"app.prices.minPrice": "ڪم قيمت"'],
  ['"app.prices.maxPrice": "Max price"', '"app.prices.maxPrice": "وڌيڪ قيمت"'],
  ['"app.prices.change": "Change"', '"app.prices.change": "Badlo"'],
  ['"app.prices.distance": "Distance"', '"app.prices.distance": "دوري"'],
  ['"app.prices.adminTitle": "Manual price entry"', '"app.prices.adminTitle": "دستي قيمت داخل"'],
  ['"app.prices.adminDate": "Date"', '"app.prices.adminDate": "تاريخ"'],
  ['"app.prices.adminHoliday": "Market holiday"', '"app.prices.adminHoliday": "بازار جي چھڏي"'],
  ['"app.prices.adminSave": "Save price"', '"app.prices.adminSave": "قيمت بچائيو"'],
  ['"app.prices.loading": "Loading prices..."', '"app.prices.loading": "قيمت لوڊ ڪري..."'],
  ['"app.prices.retry": "Try again"', '"app.prices.retry": "ٻڌي ڪوشش ڪريو"'],
  ['"app.prices.noPricesForCrop": "No prices found for this crop nearby."', '"app.prices.noPricesForCrop": "ھن ٻج لاءِ قريبتي قيمت نه ملئ."'],
  ['"app.prices.comingSoon": "Coming soon"', '"app.prices.comingSoon": "جلد اچي رھا آهي"'],
  ['"app.prices.selectFarm": "Select farm"', '"app.prices.selectFarm": "فارم چونڊيو"'],
  ['"app.prices.noFarms": "Add a farm first to see nearby prices"', '"app.prices.noFarms": "قريبتي قيمت ڏيکارڻ لاءِ پہلي فارم شامل ڪريو"'],
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
console.log(`Prices: ${ok} replaced, ${fail} not found.`);
