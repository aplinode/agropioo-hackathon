const fs = require('fs');

const API_KEY = fs.readFileSync('.env', 'utf8').match(/OPENAI_API_KEY=(.+)/)[1].trim();
const BASE_URL = 'https://api.groq.com/openai/v1';

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const lines = ur.split('\n');

// Extract all key-value pairs
const entries = [];
const headerLines = [];
let inBody = false;

for (const line of lines) {
  if (line.startsWith('export const')) {
    headerLines.push(line);
    continue;
  }
  if (line.includes('{')) {
    inBody = true;
    continue;
  }
  if (inBody && line.includes('"') && line.includes(':')) {
    const match = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
    if (match) {
      entries.push({ key: match[1], urValue: match[2] });
    }
  }
}

console.log('Found', entries.length, 'entries to translate');

const LOCALE_NAMES = {
  sd: 'Sindhi (سنڌي)',
  ps: 'Pashto (پښتو)',
  pa: 'Punjabi (پنجابی)',
  bal: 'Balochi (بلۏچی)',
  skr: 'Saraiki (سرائیکی)',
  hno: 'Hindko (ہندکو)',
};

async function translateBatch(texts, targetLang) {
  const prompt = `Translate these Urdu strings to ${targetLang}. Keep {n}, {seconds}, {km} placeholders unchanged. Return ONLY a JSON array of translated strings, same order. No explanation.

${texts.map((t, i) => `${i}: ${t}`).join('\n')}`;

  const resp = await fetch(BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY,
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('API error: ' + resp.status + ' ' + err);
  }

  const data = await resp.json();
  const content = data.choices[0].message.content;

  // Extract JSON array from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array in response: ' + content.substring(0, 200));
  }

  return JSON.parse(jsonMatch[0]);
}

async function translateLocale(code) {
  console.log(`\nTranslating to ${LOCALE_NAMES[code]}...`);

  const BATCH_SIZE = 80;
  const translations = {};

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const texts = batch.map(e => e.urValue);
    const process = Math.min(i + BATCH_SIZE, entries.length);
    console.log(`  Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(entries.length/BATCH_SIZE)} (${process}/${entries.length})...`);

    try {
      const results = await translateBatch(texts, LOCALE_NAMES[code].split(' (')[0]);

      for (let j = 0; j < batch.length; j++) {
        translations[batch[j].key] = results[j] || batch[j].urValue;
      }
      console.log(' OK');
    } catch (e) {
      console.log(' FAILED:', e.message);
      // Fallback: keep Urdu values
      for (const entry of batch) {
        translations[entry.key] = entry.urValue;
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // Build the file
  const langName = LOCALE_NAMES[code];
  let content = `import type { CatalogKey } from "./en.ts";\n\n`;
  content += `/** ${langName} — AI-translated from Urdu reference. RTL language. */\n`;
  content += `export const ${code}: Partial<Record<CatalogKey, string>> = {\n`;

  for (const line of lines) {
    if (line.startsWith('import') || line.startsWith('/**') || line.startsWith('export const') || line.includes('{') || line.includes('}')) {
      // Skip header and structure lines
      continue;
    }
    const match = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
    if (match) {
      const key = match[1];
      const val = translations[key] || match[2];
      content += `  "${key}": "${val.replace(/"/g, '\\"')}",\n`;
    }
  }

  content += `};\n\nexport type CatalogKey = keyof typeof ${code};\n`;

  fs.writeFileSync(`catalog/${code}.ts`, content);
  console.log(`  Written catalog/${code}.ts (${Object.keys(translations).length} keys)`);
}

async function main() {
  const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];

  for (const locale of locales) {
    await translateLocale(locale);
  }

  console.log('\nDone! All 6 locales translated.');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
