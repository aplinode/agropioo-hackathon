const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  ['"app.farms.eyebrow": "Farms"', '"app.farms.eyebrow": "فارم"'],
  ['"app.farms.health.good": "Good"', '"app.farms.health.good": "ڇوSortable"'],
  ['"app.farms.health.watch": "Watch"', '"app.farms.health.watch": "ڇاڻو"'],
  ['"app.farms.units.acres": "acres"', '"app.farms.units.acres": "اڪر"'],
  ['"app.farms.stages.sowing": "Sowing"', '"app.farms.stages.sowing": "ڦڙين"'],
  ['"app.farms.stages.tillering": "Tillering"', '"app.farms.stages.tillering": "ٽيلرنگ"'],
  ['"app.farms.stages.vegetative": "Vegetative"', '"app.farms.stages.vegetative": "نباتاتي"'],
  ['"app.farms.stages.grainFilling": "Grain filling"', '"app.farms.stages.grainFilling": "ڻڍڻ"'],
  ['"app.farms.stages.ready": "Ready"', '"app.farms.stages.ready": "تيار"'],
  ['"app.farms.stages.squaring": "Squaring"', '"app.farms.stages.squaring": "سڪوارنگ"'],
  ['"app.farms.stages.flowering": "Flowering"', '"app.farms.stages.flowering": "پنڌار"'],
  ['"app.farms.stages.bollFilling": "Boll filling"', '"app.farms.stages.bollFilling": "ٻال ڀريل"'],
  ['"app.farms.stages.grandGrowth": "Grand growth"', '"app.farms.stages.grandGrowth": "وڍيڪ وڌاڻ"'],
  ['"app.farms.stages.ripening": "Ripening"', '"app.farms.stages.ripening": "پڪڻ"'],
  ['"app.farms.stages.harvest": "Harvest"', '"app.farms.stages.harvest": "ڦڙي"'],
  ['"app.farms.stages.panicleInitiation": "Panicle initiation"', '"app.farms.stages.panicleInitiation": "پنڍل شروعات"'],
  ['"app.farms.districts.multan": "Multan"', '"app.farms.districts.multan": "ملتان"'],
  ['"app.farms.districts.sahiwal": "Sahiwal"', '"app.farms.districts.sahiwal": "ساهيول"'],
  ['"app.farms.districts.faisalabad": "Faisalabad"', '"app.farms.districts.faisalabad": "فيصل آباد"'],
  ['"app.farms.districts.vehari": "Vehari"', '"app.farms.districts.vehari": "وِھاري"'],
  ['"app.farms.districts.bahawalpur": "Bahawalpur"', '"app.farms.districts.bahawalpur": "بهاولپور"'],
  ['"app.farms.districts.lodhran": "Lodhran"', '"app.farms.districts.lodhran": "لودھڙن"'],
  ['"app.farms.crops.wheat": "Wheat"', '"app.farms.crops.wheat": "گندم"'],
  ['"app.farms.crops.cotton": "Cotton"', '"app.farms.crops.cotton": "ڪپاس"'],
  ['"app.farms.crops.sugarcane": "Sugarcane"', '"app.farms.crops.sugarcane": "茎inha"'],
  ['"app.farms.crops.maize": "Maize"', '"app.farms.crops.maize": "مڪئي"'],
  ['"app.farms.crops.rice": "Rice"', '"app.farms.crops.rice": "چاول"'],
  ['"app.farms.list.pageTitle": "Farms — Agropioo"', '"app.farms.list.pageTitle": "فارم — Agropioo"'],
  ['"app.farms.list.heading": "All your farms, one list"', '"app.farms.list.heading": "توھان جا سڀ فارم، هڪ فهرست"'],
  ['"app.farms.list.addLink": "Add"', '"app.farms.list.addLink": "شامل"'],
  ['"app.farms.list.openFarm": "Open farm"', '"app.farms.list.openFarm": "فارم کوليو"'],
  ['"app.farms.list.addNewFarm": "Add a new farm"', '"app.farms.list.addNewFarm": "نئون فارم شامل ڪريو"'],
  ['"app.farms.list.emptyHeading": "No farms yet"', '"app.farms.list.emptyHeading": "اڃا فارم نه آهن"'],
  ['"app.farms.new.pageTitle": "Add a farm — Agropioo"', '"app.farms.new.pageTitle": "فارم شامل ڪريو — Agropioo"'],
  ['"app.farms.new.heading": "Add a farm"', '"app.farms.new.heading": "فارم شامل ڪريو"'],
  ['"app.farms.new.fields.name": "Farm name"', '"app.farms.new.fields.name": "فارم جو نالو"'],
  ['"app.farms.new.placeholders.name": "e.g. Khalilpur Farm"', '"app.farms.new.placeholders.name": "جئن خاليلپور فارم"'],
  ['"app.farms.new.fields.district": "District / City"', '"app.farms.new.fields.district": "ضلع / شهر"'],
  ['"app.farms.new.placeholders.district": "Choose District / City"', '"app.farms.new.placeholders.district": "ضلع / شهر چونڊيو"'],
  ['"app.farms.new.fields.crop": "Main crop"', '"app.farms.new.fields.crop": "مکيٽي ٻج"'],
  ['"app.farms.new.placeholders.crop": "Choose crop"', '"app.farms.new.placeholders.crop": "ٻج چونڊيو"'],
  ['"app.farms.new.fields.acres": "Area (acres)"', '"app.farms.new.fields.acres": "AREA (اڪر)"'],
  ['"app.farms.new.placeholders.acres": "e.g. 12.5"', '"app.farms.new.placeholders.acres": "جئن 12.5"'],
  ['"app.farms.new.fields.location": "Location / Village"', '"app.farms.new.fields.location": "جڳھ / ڳائو"'],
  ['"app.farms.new.placeholders.location": "Type village or city name"', '"app.farms.new.placeholders.location": "ڳائو يا شهر جو نالو ٽائپ ڪريو"'],
  ['"app.farms.new.fields.primaryCrop": "Primary crop"', '"app.farms.new.fields.primaryCrop": "پہرو ٻج"'],
  ['"app.farms.new.fields.sowingDate": "Sowing date"', '"app.farms.new.fields.sowingDate": "ڦڙين جي تاريخ"'],
  ['"app.farms.new.fields.soilType": "Soil type"', '"app.farms.new.fields.soilType": "مٹي جو قسم"'],
  ['"app.farms.new.fields.irrigationMethod": "Irrigation method"', '"app.farms.new.fields.irrigationMethod": "آبياري جو طريقو"'],
  ['"app.farms.new.placeholders.soilType": "Clay, loam, sandy, or silt"', '"app.farms.new.placeholders.soilType": "ميتي، لوم، ريتلي، يا سلٽ"'],
  ['"app.farms.new.buttons.save": "Save farm"', '"app.farms.new.buttons.save": "فارم بچائيو"'],
  ['"app.farms.new.success.heading": "Farm saved in demo"', '"app.farms.new.success.heading": "فارم ڊيمو ۾ بچائي وئو"'],
  ['"app.farms.new.success.goToFarms": "Go to my farms"', '"app.farms.new.success.goToFarms": "مون جا فارم تي وڃو"'],
  ['"app.farms.new.success.backToDashboard": "Back to dashboard"', '"app.farms.new.success.backToDashboard": "ڊيٽاشيلڊ تي واپس"'],
  ['"app.farms.new.errors.nameRequired": "Give your farm a name."', '"app.farms.new.errors.nameRequired": "فارم جو نالو ڏيو."'],
  ['"app.farms.new.errors.districtRequired": "Pick the district."', '"app.farms.new.errors.districtRequired": "ضلع چونڊيو."'],
  ['"app.farms.new.errors.cropRequired": "Pick the main crop."', '"app.farms.new.errors.cropRequired": "مکيٽي ٻج چونڊيو."'],
  ['"app.farms.new.errors.acresRequired": "Enter the area in acres."', '"app.farms.new.errors.acresRequired": "area اڪر ۾ داخل ڪريو."'],
  ['"app.farms.detail.pageTitle": "Farm details — Agropioo"', '"app.farms.detail.pageTitle": "فارم تفصيل — Agropioo"'],
  ['"app.farms.detail.heroEyebrow": "Farm details"', '"app.farms.detail.heroEyebrow": "فارم تفصيل"'],
  ['"app.farms.detail.goodHealth": "Good health"', '"app.farms.detail.goodHealth": "acho صحت"'],
  ['"app.farms.detail.needsWatching": "Needs watching"', '"app.farms.detail.needsWatching": "ڇاڻو ضروري"'],
  ['"app.farms.detail.sownLabel": "Sown"', '"app.farms.detail.sownLabel": "ڦڙيل"'],
  ['"app.farms.detail.seasonHeading": "Where the crop stands"', '"app.farms.detail.seasonHeading": "ٻج ڪيئن آهي"'],
  ['"app.farms.detail.activityHeading": "Field activity"', '"app.farms.detail.activityHeading": "فيليڊ سرگرمي"'],
  ['"app.farms.detail.viewAllRecords": "View all records"', '"app.farms.detail.viewAllRecords": "ڳنڍا رڪارڊ ڏيکاريو"'],
  ['"app.farms.detail.logFieldEvent": "Log a field event"', '"app.farms.detail.logFieldEvent": "فيليڊ واقعو رڪارڊ ڪريو"'],
  ['"app.farms.detail.scanCrop": "Scan this crop"', '"app.farms.detail.scanCrop": "ھن ٻج کي اسڪين ڪريو"'],
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
console.log(`Farms: ${ok} replaced, ${fail} not found.`);
