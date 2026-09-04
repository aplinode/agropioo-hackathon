const fs = require('fs');
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const satCount = (ur.match(/app\.satellite/g) || []).length;
const totalKeys = (ur.match(/"[^"]+"\s*:/g) || []).length;
console.log('ur.ts total keys:', totalKeys);
console.log('ur.ts satellite refs:', satCount);
console.log('Has app.satellite.nav:', ur.includes('app.satellite.nav'));

const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const sdSat = (sd.match(/app\.satellite/g) || []).length;
const sdTotal = (sd.match(/"[^"]+"\s*:/g) || []).length;
console.log('sd.ts total keys:', sdTotal);
console.log('sd.ts satellite refs:', sdSat);
