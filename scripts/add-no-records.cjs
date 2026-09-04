const fs = require('fs');

const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];
const translations = {
  sd: "ابھي تک کوئی ریکارڈ نہیں — اپنے فارم کی یاداشت بنانے کے لیے کھیتی واقعات درج کریں۔",
  ps: "اها وخت تک کوئی ریکارډ نشته — خپل فارم یادښت جوړولو لپاره د پټونو پیښو ریکارډ وکړئ.",
  pa: "ہਜੇ ਤੱਕ ਕੋਈ ਰਿਕਾਰਡ ਨਹੀਂ — ਆਪਣੇ ਫਾਰਮ ਦੀ ਯਾਦਾਸ਼ਤ ਬਣਾਉਣ ਲਈ ਖੇਤ ਦੀਆਂ ਘਟਨਾਵਾਂ ਦਰਜ ਕਰੋ।",
  bal: "default: ابھي تک کوئی ریکارڈ نه — اپنئ فارم جي ياداشت بناوڻ لاءِ کيتي جا واقعات درج ڪريو.",
  skr: "default: ابھي تک کوئی ریکارڈ نہیں — اپنے فارم کی یاداشت بنانے کے لیے کھیتی واقعات درج کریں۔",
  hno: "default: ابھي تک کوئی ریکارڈ نہیں — اپنے فارم کی یاداشت بنانے کے لیے کھیتی واقعات درج کریں۔",
};

for (const lang of locales) {
  let content = fs.readFileSync(`catalog/${lang}.ts`, 'utf8');
  
  // Find the last entry before the closing brace
  const lines = content.split('\n');
  let lastEntryIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^\s+"[^"]+"\s*:\s*"/)) {
      lastEntryIndex = i;
      break;
    }
  }
  
  if (lastEntryIndex === -1) continue;
  
  // Check if key already exists
  if (content.includes('"app.farms.detail.noRecords"')) {
    console.log(`${lang}.ts: key already exists`);
    continue;
  }
  
  // Add the key
  const newLine = `  "app.farms.detail.noRecords": "${translations[lang]}",`;
  lines.splice(lastEntryIndex + 1, 0, newLine);
  
  fs.writeFileSync(`catalog/${lang}.ts`, lines.join('\n'));
  console.log(`${lang}.ts: added app.farms.detail.noRecords`);
}
