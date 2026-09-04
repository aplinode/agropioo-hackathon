const fs = require('fs');
let sd = fs.readFileSync('catalog/sd.ts', 'utf8');

const translations = [
  // ==================== AUTH ====================
  ['"auth.backHome": "Back to home"', '"auth.backHome": "گھر تي واپس"'],
  ['"auth.emailLabel": "Email address"', '"auth.emailLabel": "اي ميل پتو"'],
  ['"auth.emailPlaceholder": "you@example.com"', '"auth.emailPlaceholder": "you@example.com"'],
  ['"auth.passwordLabel": "Password"', '"auth.passwordLabel": "پاسورڊ"'],
  ['"auth.showPassword": "Show password"', '"auth.showPassword": "پاسورڊ ڏيکاريو"'],
  ['"auth.hidePassword": "Hide password"', '"auth.hidePassword": "پاسورڊ ڦڏيويو"'],
  ['"auth.err.emailRequired": "Enter your email address."', '"auth.err.emailRequired": "پنھن جو اي ميل پتو داخل ڪريو."'],
  ['"auth.err.emailInvalid": "Enter a valid email address."', '"auth.err.emailInvalid": "_VALID اي ميل پتو داخل ڪريو."'],
  ['"auth.err.passwordRequired": "Choose a password."', '"auth.err.passwordRequired": "پاسورڊ چونڊيو."'],
  ['"auth.err.passwordMin": "Use at least 8 characters."', '"auth.err.passwordMin": "گھٽ ۾ 8 حروف استعمال ڪريو."'],
  ['"auth.err.passwordMax": "Use at most 64 characters."', '"auth.err.passwordMax": "وڌيڪ ۾ 64 حروف استعمال ڪريو."'],
  ['"auth.err.nameRequired": "Enter your full name."', '"auth.err.nameRequired": "پنھن جو پورو نالو داخل ڪريو."'],
  ['"auth.err.phoneInvalid": "Enter a valid phone number."', '"auth.err.phoneInvalid": "درست ٿائيفون نمبر داخل ڪريو."'],
  ['"auth.err.confirmRequired": "Repeat your password."', '"auth.err.confirmRequired": "پنھن جو پاسورڊ دوباره ڇڏيو."'],
  ['"auth.err.termsRequired": "Please accept the terms to continue."', '"auth.err.termsRequired": "جاري رکڻ لاءِ شرائطو قبول ڪريو."'],
  ['"auth.err.passwordMismatch": "Passwords do not match."', '"auth.err.passwordMismatch": "پاسورڊ ميل نه کڻي ٿا."'],
  ['"auth.err.loginPasswordRequired": "Enter your password."', '"auth.err.loginPasswordRequired": "پنھن جو پاسورڊ داخل ڪريو."'],
  ['"auth.err.tooManyAttempts": "Too many attempts — please try again later."', '"auth.err.tooManyAttempts": "بہت ڪوششن — پاڻ ٻڌي ڪوشش ڪريو."'],
  ['"auth.err.serverError": "Something went wrong on our side. Please try again."', '"auth.err.serverError": "ạnhن جي پاسي ڪجهه خراب ٿيو. ٻڌي ڪوشش ڪريو."'],
  ['"auth.err.invalidCredentials": "Invalid email or password."', '"auth.err.invalidCredentials": "galat اي ميل يا پاسورڊ."'],

  // ==================== LOGIN ====================
  ['"li.title": "Sign in to Agropioo"', '"li.title": "Agropioo ۾ سائن ان"'],
  ['"li.heading": "Welcome back"', '"li.heading": "خوش آمدید"'],
  ['"li.demo.aria": "Preview of an Agropioo advisor conversation"', '"li.demo.aria": "Agropioo مشاور ڳالهابين جو предварител"'],
  ['"li.demo.user": "Meri gandum ki pattiyan peeli ho rahi hain — kya karoon?"', '"li.demo.user": "Meri gandum ki pattiyan peeli ho rahi hain — kya karoon?"'],
  ['"li.demo.advisorLabel": "Do causes:"', '"li.demo.advisorLabel": "Do causes:"'],
  ['"li.demo.advisorBody": "water stress ya nitrogen ki kami. Pehle subah cool hours mein pani dein."', '"li.demo.advisorBody": "water stress ya nitrogen ki kami. Pehle subah cool hours mein pani dein."'],
  ['"li.point1": "AI advisor in your own language"', '"li.point1": "AI مشاور پنھن جي ڀاڱي ۾"'],
  ['"li.point2": "Satellite crop health monitoring"', '"li.point2": "سیلیٽ ٻج جي صحت جي نگراني"'],
  ['"li.point3": "Digital records for every season"', '"li.point3": "هر موسم لاءِ ڊجٽل رڪارڊ"'],
  ['"li.eyebrow": "Sign in"', '"li.eyebrow": "سائن ان"'],
  ['"li.titleTag": "Sign in — Agropioo"', '"li.titleTag": "سائن ان — Agropioo"'],
  ['"li.sub": "Sign in to reach your farm\'s advisor, records, and advisories."', '"li.sub": "فارم جي مشاور، رڪارڊ، ۽ مشورا تي پهونچڻ لاءِ سائن ان ڪريو."'],
  ['"li.emailPlaceholder": "you@example.com"', '"li.emailPlaceholder": "you@example.com"'],
  ['"li.passwordPlaceholder": "Your password"', '"li.passwordPlaceholder": "توھان جو پاسورڊ"'],
  ['"li.forgot": "Forgot password?"', '"li.forgot": "پاسورڊ وڃريل؟"'],
  ['"li.submit": "Sign in"', '"li.submit": "سائن ان"'],
  ['"li.noAccount": "No account yet? Early access is rolling out region by region —"', '"li.noAccount": "اڃا اکائونٹ نه آهي؟早期 access هڪ هڪ خطي ۾ وڌي رھي آهي —"'],
  ['"li.createAccount": "create your account"', '"li.createAccount": "پنھن جو اکائونٹ ٺھائيو"'],

  // ==================== SIGNUP ====================
  ['"su.title": "Create your Agropioo account"', '"su.title": "Agropioo اکائونٹ ٺھائيو"'],
  ['"su.heading": "Start farming smarter"', '"su.heading": "سمارٽ فارمنگ شروع ڪريو"'],
  ['"su.profile.aria": "Preview of the farm profile created after sign up"', '"su.profile.aria": "سائن اپ کان پاڻ ٺھائي وئي فارم پروفائل جو предварител"'],
  ['"su.profile.badge": "Farm profile · ready in a minute"', '"su.profile.badge": "فارم پروفائل · ھڪ منشن ۾ تيار"'],
  ['"su.profile.district": "District"', '"su.profile.district": "ضلع"'],
  ['"su.profile.crop": "Crop"', '"su.profile.crop": "ٻج"'],
  ['"su.profile.language": "Advisory language"', '"su.profile.language": "مشاوري جو ڀاڱو"'],
  ['"su.profile.districtValue": "Multan"', '"su.profile.districtValue": "ملتان"'],
  ['"su.profile.cropValue": "Wheat · Rabi"', '"su.profile.cropValue": "گندم · ربي"'],
  ['"su.profile.langValue": "Roman Urdu"', '"su.profile.langValue": "رومن اردو"'],
  ['"su.included1": "Personalised advisor from day one"', '"su.included1": "پہلي دن کان شخصي مشاور"'],
  ['"su.included2": "Weather-aware guidance for your district"', '"su.included2": "توھان جي ضلع لاءِ موسم ڄاڻي تي راهائتي"'],
  ['"su.included3": "Farm records that sharpen every season"', '"su.included3": "فارم رڪارڊ جن جو هر موسم وڌي ٿو"'],
  ['"su.eyebrow": "Create account"', '"su.eyebrow": "اکائونٹ ٺھائيو"'],
  ['"su.titleTag": "Create account — Agropioo"', '"su.titleTag": "اکائونٹ ٺھائيو — Agropioo"'],
  ['"su.sub": "One account for your advisor, records, and every advisory this season."', '"su.sub": "توھان جي مشاور، رڪارڊ، ۽ ھن موسم جي ھر مشورو لاءِ هڪ اکائونٹ."'],
  ['"su.registered.title": "This email is already registered."', '"su.registered.title": "ھن اي ميل تي اڳhed registered آهي."'],
  ['"su.registered.reset": "Reset password"', '"su.registered.reset": "پاسورڊ ريسٽ"'],
  ['"su.name.label": "Full name"', '"su.name.label": "پورو نالو"'],
  ['"su.name.placeholder": "e.g. Muhammad Ahmad"', '"su.name.placeholder": "جئن محمد احمد"'],
  ['"su.phone.label": "Phone number"', '"su.phone.label": "ٿائيفون نمبر"'],
  ['"su.phone.optional": "(optional)"', '"su.phone.optional": "(اختياري)"'],
  ['"su.phone.note": "For SMS alerts when you are offline."', '"su.phone.note": "آن لائن نه هئن تInSection SMS Alerts لاءِ."'],
  ['"su.password.placeholder": "At least 8 characters"', '"su.password.placeholder": "گھٽ ۾ 8 حروف"'],
  ['"su.confirm.label": "Confirm password"', '"su.confirm.label": "پاسورڊ تائيد"'],
  ['"su.confirm.placeholder": "Repeat your password"', '"su.confirm.placeholder": "پنھن جو پاسورڊ دوباره ڇڏيو"'],
  ['"su.strength0": "Too short"', '"su.strength0": "بہت ٽول"'],
  ['"su.strength1": "Weak"', '"su.strength1": "ڪمزور"'],
  ['"su.strength2": "Fair"', '"su.strength2": "درميانا"'],
  ['"su.strength3": "Strong"', '"su.strength3": "مضبوط"'],
  ['"su.terms.prefix": "I agree to the"', '"su.terms.prefix": "مون شرائطو سان اتفاق ڪيو"'],
  ['"su.terms.and": "and"', '"su.terms.and": "۽"'],
  ['"su.terms.tos": "Terms of Service"', '"su.terms.tos": "سروس جا شرائطو"'],
  ['"su.terms.of": "of"', '"su.terms.of": "ج"'],
  ['"su.terms.privacy": "Privacy Policy"', '"su.terms.privacy": "رازداري پاليسئ"'],
  ['"su.submit": "Create my account"', '"su.submit": "مون جو اکائونٹ ٺھائيو"'],
  ['"su.haveAccount": "Already have an account?"', '"su.haveAccount": "اڳhed اکائونٹ آهي؟"'],
  ['"su.signInLink": "Sign in"', '"su.signInLink": "سائن ان"'],
];

let ok = 0, fail = 0;
for (const [from, to] of translations) {
  if (sd.includes(from)) {
    sd = sd.replace(from, to);
    ok++;
  } else {
    console.log('NOT FOUND:', from.substring(0, 65));
    fail++;
  }
}

fs.writeFileSync('catalog/sd.ts', sd);
console.log(`Auth/Login/Signup: ${ok} replaced, ${fail} not found.`);
