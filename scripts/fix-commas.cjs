const fs = require('fs');
const content = fs.readFileSync('catalog/sd.ts', 'utf8');

// Find lines that have a key-value pair followed by a newline and another key-value pair without a comma
const lines = content.split('\n');
const fixes = [];

for (let i = 0; i < lines.length - 1; i++) {
  const line = lines[i].trim();
  const nextLine = lines[i + 1].trim();
  
  // Current line has a value that ends with " but no comma
  if (line.match(/"\s*:\s*"[^"]*"\s*$/) && nextLine.match(/^"[^"]+"\s*:/)) {
    fixes.push(i + 1); // 1-indexed
  }
}

console.log(`Found ${fixes.length} missing commas at lines:`, fixes);

// Fix all missing commas
let fixed = content;
for (const lineNum of fixes) {
  const lines = fixed.split('\n');
  const line = lines[lineNum - 1];
  // Add comma before the newline
  if (line.trim().endsWith('"') && !line.trim().endsWith('",')) {
    lines[lineNum - 1] = line.trimEnd() + ',';
    fixed = lines.join('\n');
  }
}

fs.writeFileSync('catalog/sd.ts', fixed);
console.log('Fixed all missing commas in sd.ts');
