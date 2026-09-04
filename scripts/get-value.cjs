const fs = require('fs');
const en = fs.readFileSync('catalog/en.ts', 'utf8');
const m = en.match(/"app\.farms\.detail\.noRecords"\s*:\s*"([^"]*)"/);
console.log(m ? m[1] : 'NOT FOUND');
