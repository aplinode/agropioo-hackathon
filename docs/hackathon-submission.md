SECTION 1 — PROBLEM STATEMENT AND PROPOSED SOLUTION

Pakistan's 45 million farmers make decisions through tradition and memory. 30–40% of crops are lost annually to preventable disease, wasted water, and bad timing. Extension services reach fewer than 5% of farmers. Agropioo is an AI agriculture advisor that knows each farmer's farm, crop, weather, and history — and tells them what to do and when, in Urdu, Punjabi, Pashto, or Sindhi.


SECTION 2 — DETAILED PROJECT DESCRIPTION

Five features in one platform: AI advisor (multi-agent, routes questions to crop, weather, prices, farm data, or schemes specialists), digital farm records (logs every activity, feeds the AI), crop disease detection (photo in, diagnosis out), mandi price tracker (live prices, sell/hold signal), and government scheme matcher (surfaces eligible subsidies automatically). Every feature works in 8 languages with full RTL support. User flow: sign up, pick language, add farm, check dashboard, ask advisor, log activity, photograph diseased crops, check prices, discover subsidies.


SECTION 3 — TECHNICAL APPROACH AND TECHNOLOGIES

Full-stack Next.js 16, no separate backend. AI advisor built on @openai/agents with triage-and-handoff architecture — 5 specialist agents with tools for live farm records, weather, prices, and knowledge base. Neon Lakebase Postgres. Auth via bcryptjs + jose JWT + OTP verification. 8-locale language system with database-stored translations. Stack: Next.js 16, React 19, @openai/agents, pg, zod, Tailwind CSS v4.


SECTION 4 — DELIVERY PLAN

Built: full auth, onboarding, farm management, farm records, AI advisor (5 agents + streaming), weather, dashboard, prices page, disease detection UI, notifications, 8-locale system with RTL, tests, seeded knowledge base.

Next: wire disease detection to live Vision API, connect live mandi data, complete scheme eligibility, mobile end-to-end test.

Solo build by Sheikh Mohammad.


SECTION 5 — REPOSITORY / DEMO LINK

Add when available.
