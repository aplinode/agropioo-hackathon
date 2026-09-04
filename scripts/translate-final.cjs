const fs = require('fs');

const API_KEY = fs.readFileSync('.env', 'utf8').match(/OPENAI_API_KEY=(.+)/)[1].trim();
const BASE_URL = 'https://api.groq.com/openai/v1';

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const entries = [];
for (const line of ur.split('\n')) {
  const m = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m) entries.push({ key: m[1], value: m[2] });
}
console.log('Total entries:', entries.length);

const LANG_NAMES = {
  sd: 'Sindhi', ps: 'Pashto', pa: 'Punjabi',
  bal: 'Balochi', skr: 'Saraiki', hno: 'Hindko',
};

async function callGroq(texts, targetLang) {
  const numbered = texts.map((t, i) => i + ': ' + t).join('\n');
  const prompt = `Translate these ${texts.length} Urdu UI strings to ${targetLang}. Keep placeholders like {n}, {seconds}, {km}, {crop}, {date}, {name} unchanged. Return ONLY a JSON array of exactly ${texts.length} translated strings in the same order. No explanation, no markdown.\n\n${numbered}`;

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
        const wait = 40 + attempt * 20;
        console.log(`      Rate limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error('API ' + resp.status + ': ' + err.substring(0, 100));
      }

      const data = await resp.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array');
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.length < texts.length) throw new Error('Too few results: ' + parsed.length);
      return parsed.slice(0, texts.length);
    } catch (e) {
      if (attempt === 4) throw e;
      console.log(`      Retry ${attempt + 1}: ${e.message.substring(0, 80)}`);
      await new Promise(r => setTimeout(r, 15000));
    }
  }
  return texts;
}

function writeLocale(code, map) {
  let content = `import type { CatalogKey } from "./en.ts";\n\n`;
  content += `/** ${LANG_NAMES[code]} — AI-translated from Urdu. RTL language. */\n`;
  content += `export const ${code}: Partial<Record<CatalogKey, string>> = {\n`;
  for (const e of entries) {
    const val = (map[e.key] || e.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    content += `  "${e.key}": "${val}",\n`;
  }
  content += `};\n\nexport type CatalogKey = keyof typeof ${code};\n`;
  fs.writeFileSync('catalog/' + code + '.ts', content);
}

function loadMap(code) {
  try {
    const c = fs.readFileSync('catalog/' + code + '.ts', 'utf8');
    const m = {};
    for (const line of c.split('\n')) {
      const match = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
      if (match) m[match[1]] = match[2];
    }
    return m;
  } catch { return {}; }
}

function isUrdu(s) {
  // Check if string contains Urdu/Arabic characters (not just Latin)
  return /[\u0600-\u06FF]/.test(s);
}

async function translateLocale(code) {
  console.log(`\n=== ${LANG_NAMES[code]} (${code}) ===`);
  const BATCH = 20;
  const map = loadMap(code);

  // Only translate entries that are still in Urdu (have Arabic chars)
  const toTranslate = entries.filter(e => {
    const val = map[e.key] || e.value;
    return isUrdu(val) && val !== e.value; // has Urdu but came from ur.ts
  });

  console.log(`  Already locale: ${entries.length - toTranslate.length}`);
  console.log(`  Need translate: ${toTranslate.length}`);

  for (let i = 0; i < toTranslate.length; i += BATCH) {
    const batch = toTranslate.slice(i, i + BATCH);
    const num = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(toTranslate.length / BATCH);
    console.log(`  Batch ${num}/${total}...`);

    try {
      const results = await callGroq(batch.map(e => e.value), LANG_NAMES[code]);
      for (let j = 0; j < batch.length; j++) {
        map[batch[j].key] = results[j];
      }
      writeLocale(code, map);
      console.log(`    OK`);
    } catch (e) {
      console.log(`    FAILED: ${e.message.substring(0, 100)}`);
    }

    // 40 second delay to stay under 8000 TPM
    console.log('    Waiting 40s...');
    await new Promise(r => setTimeout(r, 40000));
  }
  console.log(`  Done`);
}

async function main() {
  // Do ps first (Pashto has most speakers after Urdu)
  await translateLocale('ps');
  // Save and do others with a pause
  for (const code of ['sd', 'pa', 'bal', 'skr', 'hno']) {
    await new Promise(r => setTimeout(r, 10000));
    await translateLocale(code);
  }
  console.log('\n=== ALL DONE ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
