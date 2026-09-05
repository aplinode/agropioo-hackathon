import "server-only";

import { query, queryOne } from "@/lib/db";

export type PestIncidenceRecord = {
  id: string;
  province: string;
  district: string;
  crop: string;
  pest_type: string;
  reported_count: number | null;
  source_url: string | null;
  data_date: string;
  raw_payload: unknown;
  fetched_at: string;
  data_may_be_outdated: boolean;
};

const PROVINCIAL_SOURCES = [
  {
    province: "Punjab",
    url: "https://www.agripunjab.gov.pk/pw_alerts",
    parser: parsePunjab,
  },
  {
    province: "Sindh",
    url: "https://agri.sindh.gov.pk/",
    parser: parseSindh,
  },
  {
    province: "Khyber Pakhtunkhwa",
    url: "https://agriculture.kp.gov.pk/",
    parser: parseKp,
  },
  {
    province: "Balochistan",
    url: "https://agriculture.balochistan.gov.pk/",
    parser: parseBalochistan,
  },
];

const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Agropioo-PestScraper/1.0" },
      cache: "no-store",
    });
    clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

function parsePunjab(html: string, province: string): Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] {
  const rows: Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] = [];
  const districtMatch = html.match(/district[:\s]+([A-Za-z\s]+)/i);
  const district = districtMatch ? districtMatch[1].trim() : province;
  const pestMatch = html.match(/pest[:\s]+([A-Za-z\s]+)/i);
  const pestType = pestMatch ? pestMatch[1].trim() : "unknown";
  const countMatch = html.match(/count[:\s]+(\d+)/i);
  const reportedCount = countMatch ? Number(countMatch[1]) : null;
  const today = new Date().toISOString().slice(0, 10);
  rows.push({
    province,
    district,
    crop: "wheat",
    pest_type: pestType.toLowerCase(),
    reported_count: reportedCount,
    source_url: "https://www.agripunjab.gov.pk/pw_alerts",
    data_date: today,
    raw_payload: { html: html.slice(0, 2000) },
  });
  return rows;
}

function parseSindh(html: string, province: string): Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] {
  const rows: Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const matches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1);
  for (const m of matches.slice(0, 20)) {
    const cells = m[1].match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (!cells || cells.length < 3) continue;
    const text = (i: number) => cells[i]?.replace(/<[^>]+>/g, "").trim() ?? "";
    rows.push({
      province,
      district: text(0) || province,
      crop: text(1).toLowerCase() || "cotton",
      pest_type: text(2).toLowerCase() || "unknown",
      reported_count: Number(text(3)) || null,
      source_url: "https://agri.sindh.gov.pk/",
      data_date: today,
      raw_payload: { row: cells.map((c) => c.replace(/<[^>]+>/g, "").trim()) },
    });
  }
  return rows.length > 0 ? rows : [{ province, district: province, crop: "cotton", pest_type: "unknown", reported_count: null, source_url: "https://agri.sindh.gov.pk/", data_date: today, raw_payload: { note: "no table rows parsed" } }];
}

function parseKp(html: string, province: string): Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] {
  const rows: Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const pestMatch = html.match(/pest[:\s]+([A-Za-z\s]+)/i);
  rows.push({
    province,
    district: province,
    crop: "wheat",
    pest_type: pestMatch ? pestMatch[1].trim().toLowerCase() : "unknown",
    reported_count: null,
    source_url: "https://agriculture.kp.gov.pk/",
    data_date: today,
    raw_payload: { html: html.slice(0, 2000) },
  });
  return rows;
}

function parseBalochistan(html: string, province: string): Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] {
  const rows: Omit<PestIncidenceRecord, "id" | "fetched_at" | "data_may_be_outdated">[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const pestMatch = html.match(/pest[:\s]+([A-Za-z\s]+)/i);
  rows.push({
    province,
    district: province,
    crop: "date palm",
    pest_type: pestMatch ? pestMatch[1].trim().toLowerCase() : "unknown",
    reported_count: null,
    source_url: "https://agriculture.balochistan.gov.pk/",
    data_date: today,
    raw_payload: { html: html.slice(0, 2000) },
  });
  return rows;
}

export async function scrapeProvincialSources(): Promise<PestIncidenceRecord[]> {
  const results: PestIncidenceRecord[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const source of PROVINCIAL_SOURCES) {
    const res = await fetchWithTimeout(source.url);
    if (!res || !res.ok) {
      const cached = await queryOne<PestIncidenceRecord>(
        `SELECT * FROM pest_incidence_records WHERE province = $1 AND data_date = $2 ORDER BY fetched_at DESC LIMIT 1`,
        [source.province, today],
      );
      if (cached) {
        results.push({ ...cached, data_may_be_outdated: true });
      }
      continue;
    }

    const html = await res.text();
    const parsed = source.parser(html, source.province);
    for (const row of parsed) {
      const existing = await queryOne<PestIncidenceRecord>(
        `SELECT * FROM pest_incidence_records WHERE province = $1 AND district = $2 AND crop = $3 AND pest_type = $4 AND data_date = $5`,
        [row.province, row.district, row.crop, row.pest_type, row.data_date],
      );
      if (existing) {
        await query(
          `UPDATE pest_incidence_records SET raw_payload = $1, fetched_at = now(), data_may_be_outdated = false WHERE id = $2`,
          [JSON.stringify(row.raw_payload), existing.id],
        );
        results.push({ ...existing, raw_payload: row.raw_payload, data_may_be_outdated: false });
      } else {
        const inserted = await queryOne<PestIncidenceRecord>(
          `INSERT INTO pest_incidence_records (province, district, crop, pest_type, reported_count, source_url, data_date, raw_payload, data_may_be_outdated) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false) RETURNING *`,
          [row.province, row.district, row.crop, row.pest_type, row.reported_count, row.source_url, row.data_date, JSON.stringify(row.raw_payload)],
        );
        if (inserted) results.push(inserted);
      }
    }
  }

  return results;
}

export async function getLatestIncidence(province: string, district: string, crop: string): Promise<PestIncidenceRecord[]> {
  const rows = await query<PestIncidenceRecord>(
    `SELECT * FROM pest_incidence_records WHERE province = $1 AND district = $2 AND crop = $3 AND data_date >= CURRENT_DATE - INTERVAL '30 days' ORDER BY data_date DESC`,
    [province, district, crop],
  );
  return rows;
}
