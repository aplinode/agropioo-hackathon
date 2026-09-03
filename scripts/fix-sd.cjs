const fs = require('fs');
let content = fs.readFileSync('catalog/sd.ts', 'utf8');

// Add import type header if missing
if (!content.includes('import type')) {
  content = 'import type { CatalogKey } from "./en.ts";\n\n' + content;
}

// Convert backtick values to double quotes
// Pattern: "key": `value` -> "key": "value"
content = content.replace(/:\s*`([^`]*)`/g, (match, val) => {
  const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return ': "' + escaped + '"';
});

// Fix export type if missing
if (!content.includes('export type CatalogKey')) {
  content = content.replace(/\n};\s*$/, '\n};\n\nexport type CatalogKey = keyof typeof sd;\n');
}

fs.writeFileSync('catalog/sd.ts', content);
console.log('Fixed sd.ts');

// Verify
const keys = [];
for (const line of content.split('\n')) {
  const m = line.match(/"([^"]+)"\s*:/);
  if (m) keys.push(m[1]);
}
console.log('Keys:', keys.length);
console.log('Has import:', content.includes('import type'));
console.log('Has export type:', content.includes('export type'));
