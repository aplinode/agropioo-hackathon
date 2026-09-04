const fs = require('fs');
const ps = fs.readFileSync('catalog/ps.ts', 'utf8');

// Find the export line
const exportLine = 'export type CatalogKey = keyof typeof ps;';
const exportIdx = ps.indexOf(exportLine);

if (exportIdx === -1) {
  console.log('Export line not found');
  process.exit(1);
}

// Find the first }; before export line
const beforeExport = ps.substring(0, exportIdx);
const closingIdx = beforeExport.lastIndexOf('};');

if (closingIdx === -1) {
  console.log('Closing }; not found');
  process.exit(1);
}

// Get everything up to and including the closing };
const goodPart = ps.substring(0, closingIdx + 2); // +2 for };

// Add export line
const result = goodPart + '\n\n' + exportLine + '\n';

fs.writeFileSync('catalog/ps.ts', result);
console.log('Fixed ps.ts: ' + result.split('\n').length + ' lines');
