/**
 * Seed script for Mandi Price Tracker & Predictor (Feature 002).
 * Populates crops, mandis, sample historical prices, and user crop preferences.
 *
 * Run: node --experimental-strip-types --env-file-if-exists=.env scripts/seed-mandi-prices.ts
 */
import { query, withTransaction } from "../lib/db.ts";
import { PAKISTAN_DISTRICTS } from "../lib/farms/districts.ts";

const CROPS = [
  { id: "wheat", category: "grain", en: "Wheat", ur: "گندم", pa: "گندم", ps: "غنم", sd: "گندم", skr: "گندم", bal: "گندم", hno: "گندم" },
  { id: "cotton", category: "cash_crop", en: "Cotton", ur: "کپاس", pa: "کپاس", ps: "کپاس", sd: "ڪپهه", skr: "کپاس", bal: "کپاس", hno: "کپاس" },
  { id: "sugarcane", category: "cash_crop", en: "Sugarcane", ur: "گنا", pa: "گنا", ps: "کنډ", sd: "ڀنڀوري", skr: "گنا", bal: "گنا", hno: "گنا" },
  { id: "maize", category: "grain", en: "Maize", ur: "مکئی", pa: "مکئی", ps: "جوار", sd: "مڪئي", skr: "مکئی", bal: "مکئی", hno: "مکئی" },
  { id: "rice-basmati", category: "grain", en: "Rice (Basmati)", ur: "چاول (باسمتی)", pa: "چاول (باسمتی)", ps: "ورځۍ (بسمتی)", sd: "چانور (باسمتی)", skr: "چاول (باسمتی)", bal: "برنج (باسمتی)", hno: "چاول (باسمتی)" },
  { id: "rice-irri", category: "grain", en: "Rice (IRRI)", ur: "چاول (IRRI)", pa: "چاول (IRRI)", ps: "ورځۍ (IRRI)", sd: "چانور (IRRI)", skr: "چاول (IRRI)", bal: "برنج (IRRI)", hno: "چاول (IRRI)" },
  { id: "gram", category: "grain", en: "Gram", ur: "چنا", pa: "چنا", ps: "چنې", sd: "چنا", skr: "چنا", bal: "چنا", hno: "چنا" },
  { id: "mustard", category: "cash_crop", en: "Mustard", ur: "سرسوں", pa: "سرسوں", ps: "سرس", sd: "سرسوں", skr: "سرسوں", bal: "سرسوں", hno: "سرسوں" },
  { id: "potato", category: "vegetable", en: "Potato", ur: "آلو", pa: "آلو", ps: "کچالو", sd: "آلو", skr: "آلو", bal: "آلو", hno: "آلو" },
  { id: "tomato", category: "vegetable", en: "Tomato", ur: "ٹماٹر", pa: "ٹماٹر", ps: "ټماټر", sd: "ٽماٽر", skr: "ٹماٹر", bal: "番茄", hno: "ٹماٹر" },
  { id: "onion", category: "vegetable", en: "Onion", ur: "پیاز", pa: "پیاز", ps: "پیاز", sd: "پیاز", skr: "پیاز", bal: "پیاز", hno: "پیاز" },
  { id: "mango", category: "fruit", en: "Mango", ur: "آم", pa: "آم", ps: "انبه", sd: "آءُ", skr: "آم", bal: "آم", hno: "آم" },
];

const PROVINCE_BY_DISTRICT: Record<string, string> = {
  Abbottabad: "khyber_pakhtunkhwa", Astore: "gilgit_baltistan", Attock: "punjab", Badin: "sindh",
  Bagh: "azad_kashmir", Bahawalnagar: "punjab", Bahawalpur: "punjab", Bannu: "khyber_pakhtunkhwa",
  Barkhan: "balochistan", Bhawalpur: "punjab", Bhimber: "azad_kashmir", Buner: "khyber_pakhtunkhwa",
  Burewala: "punjab", Chagai: "balochistan", Chakwal: "punjab", Charsadda: "khyber_pakhtunkhwa",
  Chiniot: "punjab", Chitral: "khyber_pakhtunkhwa", Dadu: "sindh", Darel: "gilgit_baltistan",
  "Dera Bugti": "balochistan", "Dera Ghazi Khan": "punjab", "Dera Ismail Khan": "khyber_pakhtunkhwa",
  Faisalabad: "punjab", Ghanche: "gilgit_baltistan", Ghotki: "sindh", Gilgit: "gilgit_baltistan",
  Gujranwala: "punjab", Gujrat: "punjab", Gwadar: "balochistan", Hafizabad: "punjab",
  Haripur: "khyber_pakhtunkhwa", Hattian: "azad_kashmir", Haveli: "azad_kashmir", Hunza: "gilgit_baltistan",
  Hyderabad: "sindh", Islamabad: "punjab", Jacobabad: "sindh", Jafarabad: "balochistan", Jampur: "punjab",
  Jhang: "punjab", Jhelum: "punjab", Kabal: "khyber_pakhtunkhwa", Kacchi: "balochistan", Kalat: "balochistan",
  Karachi: "sindh", Karak: "khyber_pakhtunkhwa", Kasur: "punjab", Khairpur: "sindh", Khanewal: "punjab",
  Khanpur: "punjab", Khushab: "punjab", Khyber: "khyber_pakhtunkhwa", Khuzdar: "balochistan",
  "Killa Saifullah": "balochistan", Kohat: "khyber_pakhtunkhwa", Kohistan: "khyber_pakhtunkhwa",
  Kotli: "azad_kashmir", Kurram: "khyber_pakhtunkhwa", Lahore: "punjab", "Lakki Marwat": "khyber_pakhtunkhwa",
  Larkana: "sindh", Lasbela: "balochistan", Layyah: "punjab", Lodhran: "punjab", "Lower Dir": "khyber_pakhtunkhwa",
  Malakand: "khyber_pakhtunkhwa", "Mandi Bahauddin": "punjab", Mansehra: "khyber_pakhtunkhwa",
  Mardan: "khyber_pakhtunkhwa", Mastung: "balochistan", Matiari: "sindh", Mianwali: "punjab",
  Mirpur: "azad_kashmir", "Mirpur Khas": "sindh", Multan: "punjab", Muzaffarabad: "azad_kashmir",
  Muzaffargarh: "punjab", "Nankana Sahib": "punjab", Narowal: "punjab", Naseerabad: "balochistan",
  "Naushahro Feroze": "sindh", Nawabshah: "sindh", "North Waziristan": "khyber_pakhtunkhwa", Nushki: "balochistan",
  Okara: "punjab", Peshawar: "khyber_pakhtunkhwa", Pishin: "balochistan", Poonch: "azad_kashmir",
  Qambar: "sindh", Quetta: "balochistan", "Rahim Yar Khan": "punjab", Rajanpur: "punjab",
  Rawalpindi: "punjab", Sahiwal: "punjab", Sanghar: "sindh", Sargodha: "punjab", Sehwan: "sindh",
  Shahdadkot: "sindh", Sheikhupura: "punjab", Sherani: "balochistan", Shikarpur: "sindh", Sialkot: "punjab",
  Sibi: "balochistan", Skardu: "gilgit_baltistan", "South Waziristan": "khyber_pakhtunkhwa", Sukkur: "sindh",
  Swabi: "khyber_pakhtunkhwa", Swat: "khyber_pakhtunkhwa", Tank: "khyber_pakhtunkhwa", Thatta: "sindh",
  Timergara: "khyber_pakhtunkhwa", "Toba Tek Singh": "punjab", Torghar: "khyber_pakhtunkhwa", Umerkot: "sindh",
  "Upper Dir": "khyber_pakhtunkhwa", Vehari: "punjab", Wah: "punjab", Washuk: "balochistan", Zhob: "balochistan",
  Ziarat: "balochistan",
};

const HUBS = new Set([
  "Lahore", "Multan", "Faisalabad", "Rawalpindi", "Gujranwala", "Sargodha", "Bahawalpur",
  "Peshawar", "Mardan", "Swat", "Kohat", "Quetta", "Khuzdar", "Gwadar",
  "Karachi", "Hyderabad", "Sukkur", "Larkana", "Mirpur Khas", "Nawabshah",
  "Muzaffarabad", "Mirpur", "Gilgit", "Skardu",
]);

const BORDERING: Record<string, string[]> = {
  Multan: ["Khanewal", "Vehari", "Lodhran", "Bahawalpur", "Rahim Yar Khan", "Muzaffargarh", "Dera Ghazi Khan"],
  Lahore: ["Kasur", "Sheikhupura", "Nankana Sahib", "Okara", "Faisalabad", "Gujranwala"],
  Faisalabad: ["Jhang", "Toba Tek Singh", "Nankana Sahib", "Sheikhupura", "Lahore", "Okara", "Sahiwal"],
  Rawalpindi: ["Attock", "Jhelum", "Chakwal", "Islamabad"],
  Gujranwala: ["Sialkot", "Narowal", "Sheikhupura", "Lahore", "Hafizabad"],
  Sargodha: ["Mianwali", "Khushab", "Jhang", "Faisalabad", "Sheikhupura", "Gujrat"],
  Bahawalpur: ["Rahim Yar Khan", "Lodhran", "Multan", "Bahawalnagar"],
  Peshawar: ["Charsadda", "Nowshera", "Kohat", "Khyber"],
  Mardan: ["Swabi", "Charsadda", "Malakand", "Swat"],
  Quetta: ["Pishin", "Killa Saifullah", "Mastung", "Kalat"],
  Karachi: ["Thatta", "Badin", "Hyderabad"],
  Hyderabad: ["Tando Allahyar", "Matiari", "Tando Muhammad Khan", "Thatta", "Badin", "Nawabshah"],
  Sukkur: ["Khairpur", "Ghotki", "Shikarpur", "Larkana"],
  Muzaffarabad: ["Hattian", "Bagh", "Poonch"],
  Gilgit: ["Hunza", "Nagar", "Darel"],
};

const COORDS: Record<string, { lat: number; lng: number }> = {
  Lahore: { lat: 31.5204, lng: 74.3587 }, Multan: { lat: 30.1575, lng: 71.5249 },
  Faisalabad: { lat: 31.418, lng: 73.079 }, Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Gujranwala: { lat: 32.1617, lng: 74.1883 }, Sargodha: { lat: 32.0836, lng: 72.6711 },
  Bahawalpur: { lat: 29.3956, lng: 71.6722 }, RahimYarKhan: { lat: 28.4202, lng: 70.2952 },
  Peshawar: { lat: 34.015, lng: 71.5249 }, Mardan: { lat: 34.198, lng: 72.04 },
  Swat: { lat: 35.2227, lng: 72.4258 }, Quetta: { lat: 30.1798, lng: 66.975 },
  Karachi: { lat: 24.8607, lng: 67.0011 }, Hyderabad: { lat: 25.396, lng: 68.3578 },
  Sukkur: { lat: 27.7139, lng: 68.8225 }, Larkana: { lat: 27.558, lng: 68.2145 },
  Muzaffarabad: { lat: 34.37, lng: 73.4718 }, Gilgit: { lat: 35.9187, lng: 74.3124 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mandiName(district: string): string {
  return `${district} Mandi`;
}

function borderingFor(district: string): string[] {
  return BORDERING[district] ?? [];
}

function coordsFor(district: string): { lat: number; lng: number } | null {
  return COORDS[district] ?? null;
}

async function seedCrops(): Promise<void> {
  for (const crop of CROPS) {
    await query(
      `insert into crops (id, name_en, name_ur, name_pa, name_ps, name_sd, name_skr, name_bal, name_hno, category)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (id) do update set
         name_en=excluded.name_en, name_ur=excluded.name_ur, name_pa=excluded.name_pa,
         name_ps=excluded.name_ps, name_sd=excluded.name_sd, name_skr=excluded.name_skr,
         name_bal=excluded.name_bal, name_hno=excluded.name_hno, category=excluded.category`,
      [crop.id, crop.en, crop.ur, crop.pa, crop.ps, crop.sd, crop.skr, crop.bal, crop.hno, crop.category]
    );
  }
  console.log(`Seeded ${CROPS.length} crops.`);
}

async function seedMandis(): Promise<void> {
  let count = 0;
  for (const district of PAKISTAN_DISTRICTS) {
    const id = `${slugify(district)}-mandi`;
    const province = PROVINCE_BY_DISTRICT[district] ?? "punjab";
    const coords = coordsFor(district);
    const bordering = borderingFor(district).map(slugify);
    await query(
      `insert into mandis (id, name_en, name_ur, district, province, bordering_districts, latitude, longitude, is_hub)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do update set
         name_en=excluded.name_en, name_ur=excluded.name_ur, district=excluded.district,
         province=excluded.province, bordering_districts=excluded.bordering_districts,
         latitude=excluded.latitude, longitude=excluded.longitude, is_hub=excluded.is_hub`,
      [id, mandiName(district), mandiName(district), slugify(district), province, bordering, coords?.lat ?? null, coords?.lng ?? null, HUBS.has(district)]
    );
    count++;
  }
  console.log(`Seeded ${count} mandis.`);
}

async function seedSamplePrices(): Promise<void> {
  const today = new Date();
  const mandis = await query<{ id: string; district: string }>(`select id, district from mandis`);
  const cropIds = CROPS.map((c) => c.id);

  let inserted = 0;
  await withTransaction(async (client) => {
    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split("T")[0];
      const isSunday = date.getDay() === 0;

      for (const mandi of mandis) {
        for (const cropId of cropIds) {
          const base = 2000 + Math.round(Math.random() * 4000);
          const modal = base + Math.round((Math.random() - 0.5) * 400);
          const min = modal - Math.round(Math.random() * 200);
          const max = modal + Math.round(Math.random() * 200);
          await client.query(
            `insert into mandi_prices (mandi_id, crop_id, date, modal_price, min_price, max_price, source, source_code, is_holiday)
             values ($1,$2,$3,$4,$5,$6,'govt_api','seed_pk_initial',$7)
             on conflict (mandi_id, crop_id, date) do update set
               modal_price=excluded.modal_price, min_price=excluded.min_price,
               max_price=excluded.max_price, is_holiday=excluded.is_holiday,
               source_code='seed_pk_initial'`,
            [mandi.id, cropId, dateStr, modal, min, max, isSunday]
          );
          inserted++;
        }
      }
    }
  });
  console.log(`Seeded ${inserted} sample price rows.`);
}

const PAKISTAN_FEDERAL_HOLIDAYS_2026: { date: string; label: string }[] = [
  { date: "2026-02-05", label: "Kashmir Day" },
  { date: "2026-03-23", label: "Pakistan Day" },
  { date: "2026-05-01", label: "Labour Day" },
  { date: "2026-08-14", label: "Independence Day" },
  { date: "2026-11-09", label: "Iqbal Day" },
  { date: "2026-12-25", label: "Quaid-e-Azam Day / Christmas" },
];

async function seedMandiHolidays(): Promise<void> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const provinces: { code: string; source: string }[] = [
    { code: "punjab", source: "amis_pk" },
    { code: "sindh", source: "samis_pk" },
    { code: "khyber_pakhtunkhwa", source: "fmis_kp" },
    { code: "balochistan", source: "bmis_balochistan" },
  ];

  let inserted = 0;
  await withTransaction(async (client) => {
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const date = new Date(start);
      date.setDate(date.getDate() + dayOffset);
      if (date.getDay() !== 0) continue;
      const dateStr = date.toISOString().split("T")[0];
      for (const p of provinces) {
        await client.query(
          `insert into mandi_holidays (province, date, label, source_code)
           values ($1,$2,'Sunday',$3)
           on conflict do nothing`,
          [p.code, dateStr, p.source]
        );
        inserted++;
      }
    }

    for (const h of PAKISTAN_FEDERAL_HOLIDAYS_2026) {
      for (const p of provinces) {
        await client.query(
          `insert into mandi_holidays (province, date, label, source_code)
           values ($1,$2,$3,$4)
           on conflict do nothing`,
          [p.code, h.date, h.label, p.source]
        );
        inserted++;
      }
    }
  });
  console.log(`Seeded ${inserted} mandi_holidays rows.`);
}

async function main(): Promise<void> {
  await seedCrops();
  await seedMandis();
  await seedSamplePrices();
  await seedMandiHolidays();
  console.log("Mandi Price Tracker seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
