const fs = require('fs');

const API_KEY = fs.readFileSync('.env', 'utf8').match(/OPENAI_API_KEY=(.+)/)[1].trim();
const BASE_URL = 'https://api.groq.com/openai/v1';

// Parse ur.ts for all entries
const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const entries = [];
for (const line of ur.split('\n')) {
  const m = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m) entries.push({ key: m[1], value: m[2] });
}
console.log('Total entries:', entries.length);

const LOCALE_NAMES = {
  sd: 'Sindhi', ps: 'Pashto', pa: 'Punjabi',
  bal: 'Balochi', skr: 'Saraiki', hno: 'Hindko',
};

async function callAPI(texts, targetLang) {
  const prompt = `You are a professional translator for agricultural apps in Pakistan. Translate these ${texts.length} Urdu strings to ${targetLang} language. Keep ALL placeholders ({n}, {seconds}, {km}, {crop}, {date}, {name}, etc.) unchanged. Keep brand names like "Kisaan Support Program" unchanged. Return ONLY a JSON array of ${texts.length} translated strings in the same order. No explanation.\n\n${texts.map((t, i) => i + ': ' + t).join('\n')}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const resp = await fetch(BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
          model: 'allam-2-7b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (resp.status === 429) {
        const wait = 35 + attempt * 20;
        console.log(`      Rate limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error('API ' + resp.status + ': ' + err.substring(0, 200));
      }

      const data = await resp.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON: ' + content.substring(0, 150));
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.length !== texts.length) throw new Error('Length mismatch: ' + parsed.length + ' vs ' + texts.length);
      return parsed;
    } catch (e) {
      if (attempt === 4) throw e;
      console.log(`      Retry ${attempt + 1}: ${e.message.substring(0, 80)}`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  return texts;
}

function writeLocale(code, translations) {
  let content = `import type { CatalogKey } from "./en.ts";\n\n`;
  content += `/** ${LOCALE_NAMES[code]} — AI-translated. RTL language. */\n`;
  content += `export const ${code}: Partial<Record<CatalogKey, string>> = {\n`;
  for (const entry of entries) {
    const val = (translations[entry.key] || entry.value).replace(/"/g, '\\"');
    content += `  "${entry.key}": "${val}",\n`;
  }
  content += `};\n\nexport type CatalogKey = keyof typeof ${code};\n`;
  fs.writeFileSync('catalog/' + code + '.ts', content);
}

function loadTranslations(code) {
  try {
    const content = fs.readFileSync('catalog/' + code + '.ts', 'utf8');
    const map = {};
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
      if (m) map[m[1]] = m[2];
    }
    return map;
  } catch { return {}; }
}

async function translateLocale(code) {
  console.log(`\n=== ${LOCALE_NAMES[code]} (${code}) ===`);

  const BATCH = 25; // smaller batches = less tokens = fewer rate limits
  const translations = loadTranslations(code);

  // Filter to only entries that need translation (skip if already has target-lang text)
  // For now, translate ALL from Urdu since we can't auto-detect target language
  const toTranslate = entries.filter(e => !translations[e.key] || translations[e.key] === e.value);

  console.log(`  Need: ${toTranslate.length} / ${entries.length}`);

  for (let i = 0; i < toTranslate.length; i += BATCH) {
    const batch = toTranslate.slice(i, i + BATCH);
    const num = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(toTranslate.length / BATCH);
    console.log(`  Batch ${num}/${total}...`);

    try {
      const results = await callAPI(batch.map(e => e.value), LOCALE_NAMES[code]);
      for (let j = 0; j < batch.length; j++) {
        translations[batch[j].key] = results[j];
      }
      writeLocale(code, translations);
      console.log(`    OK (${Object.keys(translations).length} keys saved)`);
    } catch (e) {
      console.log(`    FAILED: ${e.message.substring(0, 100)}`);
    }

    await new Promise(r => setTimeout(r, 12000)); // 12s between batches
  }

  console.log(`  Done: ${Object.keys(translations).length} keys`);
}

async function main() {
  // Do one locale at a time with a pause between locales
  for (const code of ['sd', 'ps', 'pa', 'bal', 'skr', 'hno']) {
    await translateLocale(code);
    console.log('  Pausing 30s before next locale...');
    await new Promise(r => setTimeout(r, 30000));
  }
  console.log('\n=== ALL DONE ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
