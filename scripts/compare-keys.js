const fs = require('fs');
const en = fs.readFileSync('C:/Users/dell/Music/hackathons/agropioo-hackathon/catalog/en.ts','utf8');
const sd = fs.readFileSync('C:/Users/dell/Music/hackathons/agropioo-hackathon/catalog/sd.ts','utf8');
const enKeys = new Set();
const sdKeys = new Set();
en.replace(/"([^"]+)":/g, (m, k) => { if(!k.startsWith('//')) enKeys.add(k); });
sd.replace(/"([^"]+)":/g, (m, k) => { if(!k.startsWith('//')) sdKeys.add(k); });
const missing = [...enKeys].filter(k => !sdKeys.has(k));
console.log('en keys:', enKeys.size, 'sd keys:', sdKeys.size, 'missing:', missing.length);
if(missing.length > 0) {
  console.log('First 30 missing:');
  missing.slice(0,30).forEach(k => console.log('  -', k));
}
