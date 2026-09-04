const pptxgen = require("pptxgenjs");

// ---------- Brand palette ----------
const C = {
  forest: "013B1F", canopy: "1C6428", leaf: "3F8839", sprout: "C1D8C1",
  stone: "F5F2EC", clay: "E8E0D5",
  ink: "0F172A", slate: "475569", cloud: "94A3B8", paper: "FFFFFF",
  night: "05140C", mint: "F0FDF4", panel: "0E1F13", cardDark: "101B17",
};
const F = { serif: "Playfair Display", body: "DM Sans", mono: "Geist Mono" };

const pptx = new pptxgen();
pptx.layout = "LAYOUT_16x9";
pptx.author = "Agropioo";
pptx.title = "Agropioo — AI Agriculture Advisor for Pakistan";

const W = 10, H = 5.625;
// assets live in ./assets relative to this build script
const A = require("path").join(__dirname, "assets");

function bg(color) { return { color }; }
function base(color) { const s = pptx.addSlide(); s.background = bg(C[color] || color); return s; }
function kicker(s, text, x, y, color = "canopy") {
  // leafy "signal" dot preceding the mono eyebrow
  s.addShape("ellipse", { x: x - 0.16, y: y + 0.09, w: 0.075, h: 0.075, fill: { color: C.leaf }, line: { type: "none" } });
  s.addText(text.toUpperCase(), { x, y, w: 9, h: 0.3, fontFace: F.mono, fontSize: 10, color: C[color] || color, charSpacing: 2, bold: true });
  return y + 0.36;
}
// Signature "furrow" band: layered green curves at the slide base, echoing the
// landing page's flowing furrow-curve motif and the logo's furrows.
function furrow(s, dark) {
  const hi = dark ? C.sprout : C.leaf, mid = dark ? C.leaf : C.canopy, lo = dark ? C.canopy : C.forest;
  const strips = [
    { y: H - 0.30, x: 0.55, w: 8.9 },
    { y: H - 0.245, x: 0.15, w: 9.7 },
    { y: H - 0.19, x: 0.75, w: 8.5 },
    { y: H - 0.135, x: 0.3, w: 9.4 },
    { y: H - 0.08, x: 0.6, w: 8.8 },
  ];
  const cols = [hi, mid, lo, mid, hi];
  for (let i = 0; i < strips.length; i++) {
    s.addShape("roundRect", { x: strips[i].x, y: strips[i].y, w: strips[i].w, h: 0.04, rectRadius: 0.02, fill: { color: cols[i] }, line: { type: "none" } });
  }
}
function head(s, text, x, y, size = 30, color = "forest", w = 8.8) {
  // height fits up to 2 lines (font size in pt -> inches: size/72 per line)
  const h = (size / 72) * 2.2 + 0.1;
  s.addText(text, { x, y, w, h, fontFace: F.serif, fontSize: size, color: C[color] || color, breakLine: true, valign: "top" });
  return y + h;
}
function body(s, lines, x, y, size = 14, color = "ink", w = 4.6, space = 10) {
  const runs = lines.map((l) => ({ text: l, options: { breakLine: true, color: C[color] || color } }));
  s.addText(runs, { x, y, w, fontFace: F.body, fontSize: size, color: C[color] || color, paraSpaceAfter: space, valign: "top" });
}
function card(s, x, y, w, h, fill = "paper", line = "clay", radius = 0.12) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: radius, fill: { color: C[fill] || fill }, line: { color: C[line] || line, width: 1 } });
}
function stat(s, x, y, num, label, numColor = "canopy", numSize = 30) {
  s.addText(num, { x, y, w: 2.6, h: 0.7, fontFace: F.mono, fontSize: numSize, bold: true, color: C[numColor] || numColor });
  s.addText(label, { x, y: y + 0.72, w: 3.0, h: 0.75, fontFace: F.body, fontSize: 11.5, color: C.slate });
}
function footer(s, idx, dark = false) {
  const c = dark ? "sprout" : "cloud";
  furrow(s, dark);
  s.addText("Agropioo  ·  Soil & Signal", { x: 0.5, y: H - 0.5, w: 4, h: 0.3, fontFace: F.mono, fontSize: 8, color: C[c], charSpacing: 1 });
  s.addText(String(idx).padStart(2, "0"), { x: W - 1.0, y: H - 0.5, w: 0.6, h: 0.3, fontFace: F.mono, fontSize: 9, color: C[c], align: "right" });
}

// ===== Slide 1: Cover (dark) =====
let s = base("night");
s.addShape("rect", { x: 0, y: 0, w: W, h: 0.05, fill: { color: C.leaf }, line: { type: "none" } });
s.addShape("rect", { x: 0, y: 0.05, w: W, h: 0.05, fill: { color: C.canopy }, line: { type: "none" } });
s.addShape("rect", { x: 0, y: 0.1, w: W, h: 0.05, fill: { color: C.sprout }, line: { type: "none" } });
s.addImage({ path: `${A}/logo-foot-green.png`, x: 0.55, y: 0.5, w: 2.6, h: 0.86 });
s.addText("BUILT FOR PAKISTAN · READY FOR THE WORLD", { x: 3.6, y: 0.78, w: 5.85, h: 0.3, fontFace: F.mono, fontSize: 9, color: C.sprout, align: "right", charSpacing: 2, bold: true });
s.addText("The farm knows more", { x: 0.75, y: 1.75, w: 8.6, h: 0.85, fontFace: F.serif, fontSize: 40, color: C.paper });
s.addText("than the farmer is told.", { x: 0.75, y: 2.6, w: 8.6, h: 0.85, fontFace: F.serif, fontSize: 40, color: C.sprout });
s.addText("An AI agriculture advisor that knows your farm, your crop, your weather, and your history — and tells you what to do and when, in your own language.", { x: 0.78, y: 3.6, w: 7.2, h: 0.95, fontFace: F.body, fontSize: 15, color: C.stone });
s.addText("GROWTH      ·      INTELLIGENCE      ·      ACCESS", { x: 0.78, y: 4.95, w: 8, h: 0.3, fontFace: F.mono, fontSize: 10, color: C.sprout, charSpacing: 3, bold: true });
s.addImage({ path: `${A}/logo-square.png`, x: 8.05, y: 3.8, w: 1.35, h: 1.35 });
footer(s, 1, true);

// ===== Slide 2: The Problem (light) =====
s = base("stone");
kicker(s, "The Problem", 0.6, 0.6);
head(s, "Decisions made by memory, when the stakes are life and livelihood.", 0.6, 1.15, 30, "forest", 8.6);
body(s, ["Pakistan's 45 million farmers plan planting, irrigation, and harvest through tradition, memory, and guesswork — with almost no live data beneath them."], 0.6, 2.55, 15, "ink", 8.8, 8);
const sy = 3.55;
card(s, 0.6, sy, 2.75, 1.5, "paper", "clay");
s.addShape("rect", { x: 0.6, y: sy, w: 2.75, h: 0.05, fill: { color: C.canopy }, line: { type: "none" } });
stat(s, 0.9, sy + 0.2, "30–40%", "of crops lost yearly to preventable disease, wasted water, and bad timing", "canopy", 26);
card(s, 3.5, sy, 2.75, 1.5, "paper", "clay");
s.addShape("rect", { x: 3.5, y: sy, w: 2.75, h: 0.05, fill: { color: C.leaf }, line: { type: "none" } });
stat(s, 3.8, sy + 0.2, "< 5%", "of farms reached by extension & advisory services", "canopy", 26);
card(s, 6.4, sy, 2.75, 1.5, "paper", "clay");
s.addShape("rect", { x: 6.4, y: sy, w: 2.75, h: 0.05, fill: { color: C.canopy }, line: { type: "none" } });
stat(s, 6.7, sy + 0.2, "45M", "farmers choosing high-stakes crops with no live data", "canopy", 26);
footer(s, 2);

// ===== Slide 3: Who it affects (dark) =====
s = base("night");
kicker(s, "Who it affects", 0.6, 0.6, "sprout");
head(s, "A disease spotted too late. A field watered before the rain. A crop sold at the wrong market.", 0.6, 1.15, 27, "paper", 8.6);
body(s, [
  "For a smallholder family, each of these is not an inconvenience — it is a season's income riding on a guess.",
  "The people with the least information have the most to lose. Agropioo is built for them, in their language, on the phone in their hand.",
], 0.6, 3.0, 15, "stone", 8.6, 12);
footer(s, 3, true);

// ===== Slide 4: Solution overview (light) =====
s = base("paper");
kicker(s, "The Solution", 0.6, 0.6);
head(s, "One platform that turns a farmer's daily crop questions into clear, timed answers.", 0.6, 1.15, 30, "forest", 8.6);
const sol = [["ASK", "AI Advisor routes each question to the right specialist", "canopy"], ["SEE", "Photo disease detection and live market prices and farm weather", "leaf"], ["KNOW", "Farm records, growth stages, and profit & loss for your own land", "leaf"], ["GROW", "Crop recommendations and the schemes you qualify for", "canopy"]];
let sx = 0.6;
for (const [t, d, ccol] of sol) {
  card(s, sx, 3.0, 2.08, 2.15, "stone", "clay");
  s.addShape("rect", { x: sx, y: 3.0, w: 2.08, h: 0.09, fill: { color: C[ccol] }, line: { type: "none" } });
  s.addText(t, { x: sx + 0.2, y: 3.25, w: 1.7, h: 0.4, fontFace: F.mono, fontSize: 14, bold: true, color: C[ccol], charSpacing: 1 });
  s.addText(d, { x: sx + 0.2, y: 3.8, w: 1.72, h: 1.2, fontFace: F.body, fontSize: 11, color: C.ink });
  sx += 2.2;
}
footer(s, 4);

// ===== Slide 5: Journey (dark) =====
s = base("night");
kicker(s, "The experience", 0.6, 0.6, "sprout");
head(s, "From first sign-up to confident daily decisions.", 0.6, 1.15, 30, "paper", 8.8);
const journey = [
  ["01", "Sign up & choose", "a language — Urdu, Punjabi, Pashto, Sindhi and more, with full right-to-left layout."],
  ["02", "Map your farm", "location, crop, and sowing date — the foundation all advice builds on."],
  ["03", "Ask the advisor", "anything about your crop; get answers grounded in your farm and live weather."],
  ["04", "Act with confidence", "diagnose a leaf, follow a weather advisory, and sell at the right price."],
];
let jy = 2.45, jh = 0.78;
for (let i = 0; i < journey.length; i++) {
  const [n, t, d] = journey[i];
  s.addText(n, { x: 0.7, y: jy + 0.02, w: 0.9, h: 0.4, fontFace: F.mono, fontSize: 18, bold: true, color: C.leaf });
  s.addText(t, { x: 1.7, y: jy, w: 7.6, h: 0.35, fontFace: F.serif, fontSize: 16, bold: true, color: C.paper });
  s.addText(d, { x: 1.7, y: jy + 0.32, w: 7.6, h: 0.4, fontFace: F.body, fontSize: 13, color: C.stone });
  if (i < journey.length - 1) s.addShape("rect", { x: 1.7, y: jy + 0.78, w: 7.5, h: 0.012, fill: { color: C.canopy }, line: { type: "none" } });
  jy += jh;
}
footer(s, 5, true);

// ===== Slide 6: Feature grid (light) =====
s = base("stone");
kicker(s, "What's built", 0.6, 0.55);
head(s, "A working suite of seven tools on one dashboard.", 0.6, 1.02, 29, "forest", 8.6);
const feats6 = [
  ["✳", "AI Advisor", "6 specialist agents, live farm data, streaming chat"],
  ["◉", "Disease Detection", "photo in, diagnosis + treatment advice out"],
  ["◈", "Mandi Prices", "live prices from 5 official sources + forecast"],
  ["⌁", "Farm Records", "fields on a map, every activity logged"],
  ["☼", "Weather Advisory", "hyperlocal forecast turned into timed advice"],
  ["₨", "Profit & Loss", "budget, spend, ROI and break-even per crop"],
];
const fw = 2.85, fgap = 0.13, fh = 1.06, frow1 = 2.28;
for (let i = 0; i < feats6.length; i++) {
  const row = Math.floor(i / 3), col = i % 3;
  const fx = 0.6 + col * (fw + fgap), fy = frow1 + row * (fh + 0.16);
  card(s, fx, fy, fw, fh, "paper", "clay", 0.1);
  s.addShape("rect", { x: fx, y: fy, w: fw, h: 0.05, fill: { color: i % 2 === 0 ? C.canopy : C.leaf }, line: { type: "none" } });
  s.addText(feats6[i][0], { x: fx + 0.16, y: fy + 0.16, w: 0.38, h: 0.4, fontFace: F.serif, fontSize: 17, color: C.leaf });
  s.addText(feats6[i][1], { x: fx + 0.52, y: fy + 0.13, w: fw - 0.64, h: 0.3, fontFace: F.body, fontSize: 12.5, bold: true, color: C.forest });
  s.addText(feats6[i][2], { x: fx + 0.52, y: fy + 0.46, w: fw - 0.64, h: 0.58, fontFace: F.body, fontSize: 9.5, color: C.slate });
}
// 7th feature as a wide green accent banner
s.addShape("roundRect", { x: 0.6, y: 4.72, w: 8.81, h: 0.52, rectRadius: 0.12, fill: { color: "0E2A18" }, line: { type: "none" } });
s.addText("▲ Crop Planner", { x: 0.85, y: 4.78, w: 2.2, h: 0.4, fontFace: F.serif, fontSize: 14, bold: true, color: C.sprout });
s.addText("Soil, season, and market demand scored to surface the crops most likely to pay this year.", { x: 3.0, y: 4.86, w: 6.2, h: 0.35, fontFace: F.body, fontSize: 11.5, color: C.paper });
footer(s, 6);

// ===== Slide 7: AI Advisor (dark) =====
s = base("night");
kicker(s, "Innovation · 01 — AI Advisor", 0.6, 0.6, "sprout");
head(s, "Not a chatbot. A triage team of specialist agents.", 0.6, 1.15, 28, "paper", 8.8);
body(s, ["A triage orchestrator understands your question and hands it to the right specialist — each with live tool access to your farm records, weather, market prices, and a curated knowledge base with vector search."], 0.6, 2.5, 14, "stone", 5.7, 8);
const agents = [["Crop advisor", "field & crop science"], ["Weather agent", "live forecast + advice"], ["Farm-data agent", "your records & history"], ["Prices agent", "markets & projections"], ["Schemes agent", "subsidies you qualify for"], ["Handoff", "human escalation when needed"]];
let ax = 6.45, ay = 2.35, aw = 1.72, ah = 1.0, acol = 0;
for (const [t, d] of agents) {
  card(s, ax, ay, aw, ah, "cardDark", "canopy", 0.1);
  s.addText(t, { x: ax + 0.12, y: ay + 0.14, w: aw - 0.24, h: 0.55, fontFace: F.body, fontSize: 11, bold: true, color: C.paper });
  s.addText(d, { x: ax + 0.12, y: ay + 0.6, w: aw - 0.24, h: 0.35, fontFace: F.body, fontSize: 8.5, color: C.sprout });
  acol++;
  if (acol % 2 === 0) { ax = 6.45; ay += 1.12; } else ax += aw + 0.14;
}
s.addShape("rect", { x: 0.6, y: 4.35, w: 4.5, h: 0.012, fill: { color: C.leaf }, line: { type: "none" } });
s.addText("Streaming responses, conversation memory, persisted history — answers grounded in each farmer's own farm.", { x: 0.6, y: 4.0, w: 5.6, h: 0.4, fontFace: F.body, fontSize: 11, color: C.stone });
footer(s, 7, true);

// ===== Slide 8: Disease detection (light) =====
s = base("paper");
kicker(s, "Innovation · 02 — Disease Detection", 0.6, 0.6);
head(s, "A photo of a leaf. A diagnosis and a treatment plan in seconds.", 0.6, 1.15, 27, "forest", 8.6);
body(s, [
  "Capture a diseased leaf → the model classifies it across 38+ crop diseases → you get the disease, a confidence score, and clear next steps.",
  "Then ask follow-up questions about it, and an AI turns the diagnosis into practical, local advice.",
], 0.6, 2.7, 14, "ink", 5.4, 10);
card(s, 6.3, 2.2, 3.15, 2.95, "stone", "clay", 0.1);
s.addText("SCAN → DIAGNOSE → TREAT", { x: 6.55, y: 2.45, w: 2.6, h: 0.3, fontFace: F.mono, fontSize: 10, bold: true, color: C.leaf, charSpacing: 1 });
const scanSteps = [["1", "Upload the affected leaf"], ["2", "Classified across 38+ diseases"], ["3", "Confidence score + diagnosis"], ["4", "Treatment advice, then ask more"]];
let sy2 = 2.95;
for (const [n, d] of scanSteps) {
  s.addText(n, { x: 6.65, y: sy2 + 0.02, w: 0.35, h: 0.3, fontFace: F.mono, fontSize: 12, bold: true, color: C.canopy });
  s.addText(d, { x: 7.0, y: sy2, w: 2.3, h: 0.4, fontFace: F.body, fontSize: 11, color: C.ink });
  sy2 += 0.52;
}
s.addShape("roundRect", { x: 6.55, y: 4.55, w: 2.6, h: 0.42, rectRadius: 0.21, fill: { color: C.canopy }, line: { type: "none" } });
s.addText("Try it in the app", { x: 6.55, y: 4.62, w: 2.6, h: 0.3, align: "center", fontFace: F.body, fontSize: 11, bold: true, color: C.paper });
footer(s, 8);

// ===== Slide 9: Prices + Weather (dark) =====
s = base("night");
kicker(s, "Innovation · 03 — Live Markets & Weather", 0.6, 0.6, "sprout");
head(s, "Real data under real decisions.", 0.6, 1.1, 28, "paper", 8.8);
s.addText("Prices you can sell to, weather you can plan around.", { x: 0.62, y: 2.0, w: 8, h: 0.4, fontFace: F.serif, fontSize: 16, color: C.sprout });
card(s, 0.6, 2.6, 4.35, 2.4, "cardDark", "canopy", 0.12);
s.addText("Mandi Prices", { x: 0.85, y: 2.8, w: 3.8, h: 0.4, fontFace: F.serif, fontSize: 19, bold: true, color: C.paper });
s.addText("Live prices pulled from five official Pakistani sources — Punjab, Sindh, KPK, Balochistan and the national SPI — with a statistical forecast of where prices are heading and sell / hold signals.", { x: 0.85, y: 3.3, w: 3.85, h: 1.5, fontFace: F.body, fontSize: 12, color: C.stone });
s.addText("Holt–Winters forecast  ·  price alerts  ·  admin ingest", { x: 0.85, y: 4.72, w: 3.85, h: 0.3, fontFace: F.mono, fontSize: 9, color: C.sprout, charSpacing: 1 });
card(s, 5.15, 2.6, 4.35, 2.4, "cardDark", "canopy", 0.12);
s.addText("Weather Advisory", { x: 5.4, y: 2.8, w: 3.8, h: 0.4, fontFace: F.serif, fontSize: 19, bold: true, color: C.paper });
s.addText("Hyperlocal forecast woven with your crop and its growth stage to produce one clear advisory a day: when to irrigate, when to spray, what to protect against — before conditions turn against you.", { x: 5.4, y: 3.3, w: 3.85, h: 1.5, fontFace: F.body, fontSize: 12, color: C.stone });
s.addText("OpenWeather  ·  stage-aware rules  ·  daily advisory", { x: 5.4, y: 4.72, w: 3.85, h: 0.3, fontFace: F.mono, fontSize: 9, color: C.sprout, charSpacing: 1 });
footer(s, 9, true);

// ===== Slide 10: Data backbone (light) =====
s = base("stone");
kicker(s, "Innovation · 04 — The Data Backbone", 0.6, 0.6);
head(s, "Advice is only as good as the farm it is grounded in.", 0.6, 1.15, 30, "forest", 8.8);
const dataCols = [
  ["Farm Records", "Every field mapped on an interactive map, every activity logged as a record with its growth stage."],
  ["Profit & Loss", "Budget a season, log expenses as they happen, and watch ROI and break-even move in real time."],
  ["Crop Planner", "Soil, season, and market demand scored to surface the crops most likely to pay this year."],
];
let dyx = 0.6;
for (const [t, d] of dataCols) {
  card(s, dyx, 2.7, 2.85, 2.3, "paper", "clay", 0.12);
  s.addShape("rect", { x: dyx, y: 2.7, w: 2.85, h: 0.06, fill: { color: C.canopy }, line: { type: "none" } });
  s.addText(t, { x: dyx + 0.2, y: 2.94, w: 2.45, h: 0.4, fontFace: F.serif, fontSize: 17, color: C.forest });
  s.addText(d, { x: dyx + 0.2, y: 3.48, w: 2.45, h: 1.4, fontFace: F.body, fontSize: 11.5, color: C.ink });
  dyx += 2.97;
}
footer(s, 10);

// ===== Slide 11: Technology (dark) =====
s = base("night");
kicker(s, "The technology", 0.6, 0.6, "sprout");
head(s, "Software-only, API-driven, built to run and to scale.", 0.6, 1.15, 28, "paper", 8.8);
const tech = [
  ["Next.js 16", "full-stack, no separate backend"],
  ["Neon Postgres", "Lakebase database, migrations in-repo"],
  ["@openai/agents", "triaging multi-agent advisor"],
  ["Hugging Face", "plant-disease vision model"],
  ["OpenWeather", "hyperlocal forecast feeds"],
  ["5 official APIs", "live mandi price ingestion"],
  ["pgvector", "knowledge-base semantic search"],
  ["Cloudinary", "scan image storage"],
];
let tx = 0.6, ty = 2.35, tw = 2.16, th = 0.72, tcol = 0;
for (const [t, d] of tech) {
  card(s, tx, ty, tw, th, "cardDark", "canopy", 0.1);
  s.addText(t, { x: tx + 0.14, y: ty + 0.09, w: tw - 0.28, h: 0.28, fontFace: F.body, fontSize: 11, bold: true, color: C.sprout });
  s.addText(d, { x: tx + 0.14, y: ty + 0.4, w: tw - 0.28, h: 0.28, fontFace: F.body, fontSize: 8.5, color: C.stone });
  tcol++;
  if (tcol % 4 === 0) { tx = 0.6; ty += 0.82; } else tx += tw + 0.12;
}
s.addText("Secured sessions  ·  every route validated  ·  per-IP rate limiting  ·  uniform error shape", { x: 0.6, y: 5.05, w: 8.8, h: 0.3, fontFace: F.mono, fontSize: 9, color: C.sprout, charSpacing: 1 });
footer(s, 11, true);

// ===== Slide 12: Feasibility (light) =====
s = base("paper");
kicker(s, "Feasibility — what we've shipped", 0.6, 0.6);
head(s, "Fully working today.", 0.6, 1.1, 32, "forest", 8.8);
card(s, 0.6, 2.3, 6.3, 2.75, "stone", "clay", 0.1);
s.addText("SHIPPED & TESTED", { x: 0.85, y: 2.5, w: 5, h: 0.3, fontFace: F.mono, fontSize: 11, bold: true, color: C.canopy, charSpacing: 1 });
const builtCheck = [
  "Full authentication — signup, OTP, login, reset (bcrypt · JWT)",
  "AI advisor with 6 agents + streaming + RAG knowledge base",
  "Disease detection — live vision model + treatment advice",
  "Mandi prices — live intake from 5 sources + forecast + alerts",
  "Weather advisory — hyperlocal forecast, stage-aware, daily",
  "Farms, records, profit & loss, crop planner — full CRUD",
  "8 languages with right-to-left layout; 246 automated tests",
];
let by = 2.9;
for (const t of builtCheck) {
  s.addText("✓", { x: 0.85, y: by - 0.04, w: 0.32, h: 0.3, fontFace: F.body, fontSize: 13, bold: true, color: C.leaf });
  s.addText(t, { x: 1.22, y: by - 0.02, w: 5.55, h: 0.3, fontFace: F.body, fontSize: 10.5, color: C.ink });
  by += 0.3;
}
card(s, 7.1, 2.3, 2.35, 2.75, "mint", "clay", 0.1);
s.addText("NEXT", { x: 7.3, y: 2.5, w: 2, h: 0.3, fontFace: F.mono, fontSize: 11, bold: true, color: C.canopy, charSpacing: 1 });
const nextItems = ["Mobile end-to-end polish", "Full non-English coverage", "Broader scheme eligibility", "Scale price sources"];
let ny = 2.9;
for (const t of nextItems) {
  s.addText("→", { x: 7.3, y: ny - 0.04, w: 0.32, h: 0.3, fontFace: F.body, fontSize: 12, bold: true, color: C.canopy });
  s.addText(t, { x: 7.62, y: ny - 0.02, w: 1.75, h: 0.32, fontFace: F.body, fontSize: 10, color: C.ink });
  ny += 0.42;
}
footer(s, 12);

// ===== Slide 13: Impact (dark) =====
s = base("night");
kicker(s, "The impact", 0.6, 0.6, "sprout");
head(s, "From memory to margin.", 0.6, 1.15, 34, "paper", 8.8);
body(s, ["When a farmer knows before they act, the pattern of loss stops repeating."], 0.6, 2.6, 15, "stone", 8.8, 10);
const impact = [["20–40%", "crops lost to preventable causes today"], ["30–40%", "water wasted irrigating before the rain"], ["15–25%", "more by selling at the right market time"], ["8", "languages, one local advisor"]];
let imx = 0.6, i_hint = 0;
for (const [n, d] of impact) {
  card(s, imx, 3.2, 2.2, 1.75, "cardDark", "canopy", 0.12);
  s.addShape("rect", { x: imx, y: 3.2, w: 2.2, h: 0.06, fill: { color: i_hint > 1 ? C.leaf : C.canopy }, line: { type: "none" } });
  s.addText(n, { x: imx + 0.2, y: 3.45, w: 1.85, h: 0.55, fontFace: F.mono, fontSize: 25, bold: true, color: C.leaf });
  s.addText(d, { x: imx + 0.2, y: 4.12, w: 1.85, h: 0.8, fontFace: F.body, fontSize: 9.5, color: C.stone });
  imx += 2.32;
  i_hint++;
}
footer(s, 13, true);

// ===== Slide 14: Vision / closing (light) =====
s = base("stone");
s.addImage({ path: `${A}/logo-light.png`, x: 0.6, y: 0.6, w: 2.6, h: 0.86 });
s.addText("Built for Pakistan.", { x: 0.75, y: 1.9, w: 8.6, h: 0.8, fontFace: F.serif, fontSize: 40, color: C.forest });
s.addText("Ready for the world.", { x: 0.75, y: 2.7, w: 8.6, h: 0.8, fontFace: F.serif, fontSize: 40, color: C.canopy });
s.addText("An agriculture that respects tradition and scales with technology — advice in every farmer's own language, on the phone already in their hand.", { x: 0.78, y: 3.7, w: 7.2, h: 0.9, fontFace: F.body, fontSize: 15, color: C.slate });
s.addShape("roundRect", { x: 0.78, y: 4.65, w: 2.6, h: 0.5, rectRadius: 0.25, fill: { color: C.canopy }, line: { type: "none" } });
s.addText("Get early access", { x: 0.78, y: 4.73, w: 2.6, h: 0.35, align: "center", fontFace: F.body, fontSize: 13, bold: true, color: C.paper });
s.addText("agropioo · by Aplinode", { x: 6.6, y: 4.8, w: 2.9, h: 0.3, fontFace: F.mono, fontSize: 9, color: C.cloud, align: "right", charSpacing: 1 });
footer(s, 14);

pptx.writeFile({ fileName: require("path").join(__dirname, "Agropioo-Pitch-Deck.pptx") })
  .then(() => console.log("DECK SAVED"))
  .catch((e) => { console.error("SAVE ERR", e); process.exit(1); });
