const fs = require('fs');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const lines = sd.split('\n');
const prefix = process.argv[2] || 'auth';
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (l.startsWith('"' + prefix + '.')) {
    console.log((i + 1) + ': ' + l);
  }
}
