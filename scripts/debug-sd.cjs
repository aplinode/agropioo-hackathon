const fs = require('fs');
const sd = fs.readFileSync('catalog/sd.ts', 'utf8');
const keys = ['app.satellite.health', 'app.satellite.dateCol', 'app.satellite.legendTitle', 'app.satellite.jobPending', 'app.satellite.retry', 'app.satellite.zoomToFarm', 'app.satellite.boundaryError'];
for (const key of keys) {
  const line = sd.split('\n').find(l => l.includes('"' + key + '"'));
  if (line) {
    console.log(key + ': ' + line.trim());
  } else {
    console.log(key + ': NOT FOUND');
  }
}
