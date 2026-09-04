const fs = require('fs');

const fixes = {
  ps: "کوآرډینیټس پاکستان د پیړو دننه لري. خپله پټونه ځای بیا وګورئ.",
  pa: "کوآرڈینیٹس پاکستان دی کھارج وچ ہیں۔ خپنے کھیت دی ټھیک ټھیک جگہ ویکھو۔",
  bal: "کوآرڈینیٹس پاکستان د بیرونے میں ہیں۔ خپنے کھیت دی ټھیک ټھیک جگہ ویکھو۔",
  skr: "کوآرڈینیٹس پاکستان د پیړو دننه لري۔ خپلے کھیت دی ټھیک ټھیک جگہ ویکھو۔",
  hno: "کوآرڈینیٹس پاکستان د پیړو دننه لري۔ خپلے کھیت دی ټھیک ټھیک جگہ ویکھو۔",
  sd: "کوآرڊينيٽس پاکستان جي ٻاهر آهن۔ خپن جي کھيتي جي جڳھ بيهائين چيڪ ڪريو.",
};

for (const [code, value] of Object.entries(fixes)) {
  const filePath = 'catalog/' + code + '.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  const escaped = "app.satellite.areaOutsidePk".replace(/\./g, '\\.');
  const regex = new RegExp('("' + escaped + '"\\s*:\\s*)"[^"]*"', 'g');
  if (regex.test(content)) {
    content = content.replace(regex, '$1"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
    fs.writeFileSync(filePath, content);
    console.log(code + ': fixed');
  } else {
    console.log(code + ': key not found');
  }
}
console.log('Done');
