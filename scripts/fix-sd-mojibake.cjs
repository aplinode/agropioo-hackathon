const fs = require('fs');

// Fix ALL remaining English values and mojibake in sd.ts
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

// Fix mojibake patterns (ΓÇö = em-dash, ΓÇª = ellipsis, ΓÇó = bullet, etc.)
sd = sd.replace(/ΓÇö/g, '—');
sd = sd.replace(/ΓÇª/g, '…');
sd = sd.replace(/ΓÇó/g, '•');
sd = sd.replace(/ΓåÆ/g, '✓');
sd = sd.replace(/Γåæ/g, '≈');
sd = sd.replace(/▌Ö/g, 'س');
sd = sd.replace(/█ü/g, 'ھ');
sd = sd.replace(/█î/g, 'ی');
sd = sd.replace(/█ô/g, 'و');
sd = sd.replace(/█Æ/g, '۔');
sd = sd.replace(/█Ö/g, 'ك');
sd = sd.replace(/╪»/g, 'ن');
sd = sd.replace(/╪º/g, 'ا');
sd = sd.replace(/╪«/g, 'ق');
sd = sd.replace(/╪▒/g, 'ر');
sd = sd.replace(/╪┐/g, 'ب');
sd = sd.replace(/╪½/g, 'ث');
sd = sd.replace(/╪ñ/g, 'ز');
sd = sd.replace(/╪╖/g, 'ش');
sd = sd.replace(/╪╖/g, 'ش');
sd = sd.replace(/╪│/g, 'س');
sd = sd.replace(/╪┤/g, 'ت');
sd = sd.replace(/╪╢/g, 'ط');
sd = sd.replace(/╪╖/g, 'ش');
sd = sd.replace(/╪╖/g, 'ش');
sd = sd.replace(/╪»/g, 'ن');
sd = sd.replace(/╪░/g, 'د');
sd = sd.replace(/╪▒/g, 'ر');
sd = sd.replace(/╪┤/g, 'ت');
sd = sd.replace(/╪╖/g, 'ش');
sd = sd.replace(/╪»/g, 'ن');
sd = sd.replace(/╪░/g, 'د');
sd = sd.replace(/╪▒/g, 'ر');
sd = sd.replace(/╪┤/g, 'ت');

// Fix remaining specific English values
const fixes = {
  "app.crops.form.soilOther": "ڳاڙهو نه / ٻيو",
  "app.crops.form.submit": "سفارش حاصل ڪريو",
  "app.crops.form.submitting": "حساب ڪڍي رهيو آهي…",
  "app.crops.form.noFarm": "سفارش حاصل ڪرڻ لاءِ پهلي فارم شامل ڪريو.",
  "app.crops.form.geoError": "سفارش پاکستان ۾ فارم لاءِ ڪل دستياب آهي.",
  "app.crops.form.regionalSoilNote": "توهيঁ جي ضلع جي علاقائي مٽي پروفائل تي مبني.",
  "app.crops.form.nationalSoilNote": "قومي اندازے تي مبني — توهيঁ جو علاقه نه.",
};

for (const [key, value] of Object.entries(fixes)) {
  const regex = new RegExp(`("${key.replace(/\./g, '\\.')}":\\s*)"[^"]*"`, 'g');
  sd = sd.replace(regex, `$1"${value}"`);
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log('Fixed sd.ts');
