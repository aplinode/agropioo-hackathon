const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  // Navigation & Shell
  ['"app.shell.nav.home": "Home"', '"app.shell.nav.home": "گھر"'],
  ['"app.shell.nav.dashboard": "Dashboard"', '"app.shell.nav.dashboard": "ڊيٽاشيلڊ"'],
  ['"app.shell.nav.farms": "Farms"', '"app.shell.nav.farms": "فارم"'],
  ['"app.shell.nav.records": "Records"', '"app.shell.nav.records": "رڪارڊ"'],
  ['"app.shell.nav.advisor": "Advisor"', '"app.shell.nav.advisor": "مشاور"'],
  ['"app.shell.nav.detect": "Detect"', '"app.shell.nav.detect": "پڇو"'],
  ['"app.shell.nav.prices": "Prices"', '"app.shell.nav.prices": "قيمت"'],
  ['"app.shell.nav.weather": "Weather"', '"app.shell.nav.weather": "موسم"'],
  ['"app.shell.nav.notifications": "Notifications"', '"app.shell.nav.notifications": "اطلاعات"'],
  ['"app.shell.nav.settings": "Settings"', '"app.shell.nav.settings": "ترتيب"'],
  ['"app.shell.nav.logout": "Log out"', '"app.shell.nav.logout": "لاگ آئٽ"'],
  ['"app.shell.signOut": "Sign out"', '"app.shell.signOut": "سائن آئٽ"'],
  ['"app.shell.aria.farmerTools": "Farmer tools"', '"app.shell.aria.farmerTools": "کسان جا ٽول"'],
  ['"app.shell.aria.currentPage": "current page"', '"app.shell.aria.currentPage": "موجودہ صفحہ"'],
  ['"app.shell.languageDialog.title": "Choose your language"', '"app.shell.languageDialog.title": "پنھن جي ڀاڱي چونڊيو"'],
  ['"app.shell.languageDialog.description": "Pick the language you want to use throughout the app.', '"app.shell.languageDialog.description": "heit ڀاڱي چونڊيو جي توھان ڄاڻي آهي."'],
  ['"app.shell.languageDialog.current": "Current language"', '"app.shell.languageDialog.current": "موجودہ ڀاڱو"'],
  ['"app.shell.languageDialog.apply": "Apply language"', '"app.shell.languageDialog.apply": "ڀاڱو لاڳو ڪريو"'],
];

let ok = 0, fail = 0;
for (const [from, to] of translations) {
  if (sd.includes(from)) {
    sd = sd.replace(from, to);
    ok++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 60));
    fail++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Shell: ${ok} replaced, ${fail} not found.`);
