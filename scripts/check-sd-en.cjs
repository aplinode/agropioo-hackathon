const fs = require('fs');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const placeholders = ['feat.manage.programName', 'auth.emailPlaceholder', 'su.phone.placeholder', 'feat.hero.tile2Value', 'feat.hero.tile3Value'];
for (const key of placeholders) {
  const line = sd.split('\n').find(l => l.includes('"' + key + '"'));
  if (line) {
    const m = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
    if (m) console.log(key + ': ' + m[2]);
  }
}
// Check for remaining English
let count = 0;
for (const line of sd.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m && /^[a-zA-Z\s\-\+\d\.\,\:\?\/\@\'\!\(\)]+$/.test(m[2])) {
    count++;
    if (count <= 30) console.log('EN: ' + m[0].substring(0, 80));
  }
}
console.log('Total English in sd.ts:', count);
