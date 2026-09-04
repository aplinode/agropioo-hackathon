const fs = require('fs');

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');

const locales = [
  { code: 'sd', name: 'Sindhi (سنڌي)' },
  { code: 'ps', name: 'Pashto (پښتو)' },
  { code: 'pa', name: 'Punjabi (پنجابی)' },
  { code: 'bal', name: 'Balochi (بلۏچی)' },
  { code: 'skr', name: 'Saraiki (سرائیکی)' },
  { code: 'hno', name: 'Hindko (ہندکو)' },
];

for (const locale of locales) {
  let content = ur;
  
  // Replace header comment
  content = content.replace(
    /\/\*\*[\s\S]*?\*\//,
    '/** ' + locale.name + ' — based on Urdu reference. RTL language. */'
  );
  
  // Replace export name
  content = content.replace(/export const ur/g, 'export const ' + locale.code);
  
  // Replace type definition
  content = content.replace(
    /export type CatalogKey = keyof typeof ur;/,
    'export type CatalogKey = keyof typeof ' + locale.code + ';'
  );
  
  fs.writeFileSync('catalog/' + locale.code + '.ts', content);
  console.log('Written catalog/' + locale.code + '.ts');
}

console.log('Done!');
