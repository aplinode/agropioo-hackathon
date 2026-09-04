const fs = require('fs');

const API_KEY = fs.readFileSync('.env', 'utf8').match(/OPENAI_API_KEY=(.+)/)[1].trim();
const BASE_URL = 'https://api.groq.com/openai/v1';

// Load existing translations to resume
function loadExisting(code) {
  try {
    const content = fs.readFileSync('catalog/' + code + '.ts', 'utf8');
    const map = {};
    const regex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      map[m[1]] = m[2];
    }
    return map;
  } catch { return {}; }
}

// Parse ur.ts
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const entries = [];
const urRegex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
let match;
// Skip first occurrence (the header comment line)
let skipFirst = true;
for (const line of ur.split('\n')) {
  if (skipFirst && line.includes('export const')) { skipFirst = false; continue; }
  const m = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m) entries.push({ key: m[1], value: m[2] });
}

console.log('Total entries:', entries.length);

const LOCALE_NAMES = {
  sd: 'Sindhi', ps: 'Pashto', pa: 'Punjabi',
  bal: 'Balochi', skr: 'Saraiki', hno: 'Hindko',
};

async function translateBatch(texts, targetLang, retries = 3) {
  const prompt = `Translate these Urdu UI strings to ${targetLang}. Keep placeholders like {n}, {seconds}, {km}, {crop} unchanged. Return ONLY a JSON array of translated strings in the same order. No explanation.\n\n${texts.map((t, i) => i + ': ' + t).join('\n')}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (resp.status === 429) {
        const err = await resp.json();
        const wait = 30 + attempt * 15;
        console.log(`    Rate limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      if (!resp.ok) throw new Error('API ' + resp.status);

      const data = await resp.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON: ' + content.substring(0, 100));
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  return texts; // fallback
}

async function translateLocale(code) {
  console.log(`\n--- ${LOCALE_NAMES[code]} (${code}) ---`);

  const BATCH = 30;
  const translations = loadExisting(code);

  // Find untranslated keys (value is still English)
  const untranslated = entries.filter(e => {
    if (translations[e.key] && !/^[a-zA-Z\s{}.:,!?()/\-@+#%$&*<>[\]|\n\r]+$/.test(translations[e.key])) {
      return false; // already has non-English text
    }
    return true;
  });

  console.log(`  Already translated: ${entries.length - untranslated.length}`);
  console.log(`  Need translation: ${untranslated.length}`);

  for (let i = 0; i < untranslated.length; i += BATCH) {
    const batch = untranslated.slice(i, i + BATCH);
    const num = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(untranslated.length / BATCH);
    console.log(`  Batch ${num}/${total} (${batch.length} keys)...`);

    try {
      const results = await translateBatch(
        batch.map(e => e.value),
        LOCALE_NAMES[code]
      );

      for (let j = 0; j < batch.length; j++) {
        translations[batch[j].key] = results[j] || batch[j].value;
      }

      // Save after each batch
      writeLocale(code, translations);
      console.log(`    OK - saved`);
    } catch (e) {
      console.log(`    FAILED: ${e.message}`);
    }

    // Wait between batches
    await new Promise(r => setTimeout(r, 8000));
  }

  console.log(`  Done: ${Object.keys(translations).length} keys`);
}

function writeLocale(code, translations) {
  const langName = LOCALE_NAMES[code];
  let content = `import type { CatalogKey } from "./en.ts";\n\n`;
  content += `/** ${langName} — translated from Urdu reference. RTL language. */\n`;
  content += `export const ${code}: Partial<Record<CatalogKey, string>> = {\n`;

  for (const entry of entries) {
    const val = translations[entry.key] || entry.value;
    content += `  "${entry.key}": "${val.replace(/"/g, '\\"')}",\n`;
  }

  content += `};\n\nexport type CatalogKey = keyof typeof ${code};\n`;
  fs.writeFileSync('catalog/' + code + '.ts', content);
}

async function main() {
  const locales = ['sd', 'ps', 'pa', 'bal', 'skr', 'hno'];
  for (const locale of locales) {
    await translateLocale(locale);
  }
  console.log('\n=== All done ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
