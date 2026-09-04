const fs = require('fs');

const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

for (const code of locales) {
  const filePath = 'catalog/' + code + '.ts';
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Find the export line
  const exportPattern = 'export type CatalogKey = keyof typeof ' + code + ';';
  const exportIdx = lines.findIndex(l => l.trim() === exportPattern);
  
  if (exportIdx === -1) {
    console.log(code + ': export line not found');
    continue;
  }
  
  // Check if there are non-empty, non-comment lines after export
  let hasJunk = false;
  for (let i = exportIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t && t !== '' && !t.startsWith('/*') && !t.startsWith('*') && !t.startsWith('//')) {
      hasJunk = true;
      break;
    }
  }
  
  if (hasJunk) {
    // Remove everything after export line
    const good = lines.slice(0, exportIdx + 1);
    good.push('');
    fs.writeFileSync(filePath, good.join('\n'));
    console.log(code + ': trimmed after export');
  } else {
    console.log(code + ': OK');
  }
}
