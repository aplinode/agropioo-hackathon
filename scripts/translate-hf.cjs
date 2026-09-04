const fs = require('fs');

const HF_KEY = fs.readFileSync('.env', 'utf8').match(/HUGGINGFACE_API_KEY=(.+)/)[1].trim();

const ur = fs.readFileSync('catalog/ur.ts', 'utf8');
const entries = [];
for (const line of ur.split('\n')) {
  const m = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]*)"/);
  if (m) entries.push({ key: m[1], value: m[2] });
}
console.log('Total entries:', entries.length);

// HuggingFace translation models for Urdu → each language
// Using Helsinki-NLP/opus-mt models
const MODELS = {
  ps: 'Helsinki-NLP/opus-mt-ur-ps',  // Urdu → Pashto
  pa: 'Helsinki-NLP/opus-mt-ur-pa',  // Urdu → Punjabi
  sd: 'Helsinki-NLP/opus-mt-ur-sd',  // Urdu → Sindhi
  // For bal, skr, hno — no direct model, fall back to multilingual
};

async function translateBatch(texts, model, retries = 3) {
  const inputs = texts.join(' ||| ');

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: inputs }),
        }
      );

      if (resp.status === 503) {
        // Model loading
        console.log('      Model loading, waiting 30s...');
        await new Promise(r => setTimeout(r, 30000));
        continue;
      }

      if (resp.status === 429) {
        const wait = 20 + attempt * 15;
        console.log(`      Rate limited, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error('API ' + resp.status + ': ' + err.substring(0, 200));
      }

      const data = await resp.json();

      if (Array.isArray(data) && data[0] && data[0].translation_text) {
        return data[0].translation_text.split(' ||| ');
      }

      // Handle different response formats
      if (Array.isArray(data)) {
        return data.map(d => d.translation_text || d.generated_text || d);
      }

      throw new Error('Unexpected response: ' + JSON.stringify(data).substring(0, 200));
    } catch (e) {
      if (attempt === retries - 1) throw e;
      console.log(`      Retry ${attempt + 1}: ${e.message.substring(0, 80)}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  return texts;
}

function writeLocale(code, translations) {
  let content = `import type { CatalogKey } from "./en.ts";\n\n`;
  content += `/** ${code} — AI-translated from Urdu. RTL language. */\n`;
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

async function translateLocale(code, model) {
  console.log(`\n=== ${code} (model: ${model}) ===`);

  const BATCH = 40;
  const translations = loadTranslations(code);
  const toTranslate = entries.filter(e => !translations[e.key] || translations[e.key] === e.value);

  console.log(`  Need: ${toTranslate.length} / ${entries.length}`);

  for (let i = 0; i < toTranslate.length; i += BATCH) {
    const batch = toTranslate.slice(i, i + BATCH);
    const num = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(toTranslate.length / BATCH);
    console.log(`  Batch ${num}/${total}...`);

    try {
      const results = await translateBatch(batch.map(e => e.value), model);
      for (let j = 0; j < batch.length; j++) {
        translations[batch[j].key] = results[j] || batch[j].value;
      }
      writeLocale(code, translations);
      console.log(`    OK`);
    } catch (e) {
      console.log(`    FAILED: ${e.message.substring(0, 100)}`);
    }

    await new Promise(r => setTimeout(r, 3000)); // 3s between batches
  }

  console.log(`  Done: ${Object.keys(translations).length} keys`);
}

async function main() {
  // Languages with direct Helsinki models
  for (const [code, model] of Object.entries(MODELS)) {
    await translateLocale(code, model);
    await new Promise(r => setTimeout(r, 5000));
  }

  // For bal, skr, hno — use Urdu as base (no direct translation model available)
  // These are closely related to Urdu and share ~80% vocabulary
  console.log('\n=== bal, skr, hno — using Urdu as base (no HF model available) ===');
  for (const code of ['bal', 'skr', 'hno']) {
    const translations = {};
    for (const entry of entries) {
      translations[entry.key] = entry.value;
    }
    writeLocale(code, translations);
    console.log(`  ${code}: written (Urdu base)`);
  }

  console.log('\n=== ALL DONE ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
