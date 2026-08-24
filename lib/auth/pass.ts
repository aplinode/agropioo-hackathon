/* State-backed access passes (plan K1/K2): every pass is a jose-signed HS256
   JWT whose jti owns a Postgres row carrying the mutable truth (consumed,
   dead, stage, revoked). Three httpOnly cookies map 1:1 to the three kinds.
   Guard truth order (FR27): cookie present → signature valid → typ matches →
   row live (not consumed/dead/expired; sessions also un-revoked) → account
   still exists. ANY failure ⇒ null; callers render ONE identical outcome. */

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { getSupabase } from "@/lib/supabase";
import { sessionRowIsActive } from "@/lib/auth/logic";

export type PassKind = "verify" | "reset" | "session";

export const PASS_COOKIE_NAMES: Record<PassKind, string> = {
  verify: "agro_verify",
  reset: "agro_reset",
  session: "agro_session",
};

/** Fixed TTLs (plan): verify 1 h · reset 1 h · session 7 d. */
export const PASS_TTL_SECONDS: Record<PassKind, number> = {
  verify: 60 * 60,
  reset: 60 * 60,
  session: 7 * 24 * 60 * 60,
};

const CLOCK_TOLERANCE_SECONDS = 30;

export type PassClaims = {
  /** Account id — or the raw submitted email for reset passes (K3). */
  sub: string;
  email: string;
  typ: PassKind;
  jti: string;
};

export type PassStateRow = {
  jti: string;
  kind: "verify" | "reset";
  email: string;
  account_id: string | null;
  stage: "pending" | "code_verified";
  wrong_total: number;
  consumed_at: string | null;
  dead_at: string | null;
  expires_at: string;
};

export type SessionRow = {
  id: string;
  account_id: string;
  expires_at: string;
  revoked_at: string | null;
};

export type VerifiedPass =
  | { kind: "verify"; claims: PassClaims; row: PassStateRow }
  | { kind: "reset"; claims: PassClaims; row: PassStateRow }
  | { kind: "session"; claims: PassClaims; row: SessionRow };

function signingKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is missing or too short (min 16 chars).");
  }
  return new TextEncoder().encode(secret);
}

/** Signature + type + expiry check with 30 s skew leeway; null on any
 * failure. Exported so tests pin the real contract (K12). */
export async function decodePassToken(
  token: string,
  kind: PassKind,
): Promise<PassClaims | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
    const { sub, jti, typ, email } = payload as Record<string, unknown>;
    if (!sub || !jti || typ !== kind || typeof email !== "string") return null;
    return { sub: String(sub), email, typ: kind, jti: String(jti) };
  } catch {
    // Expired, tampered, malformed — one identical neutral outcome (FR11).
    return null;
  }
}

/** Exposed for tests and internal minting; routes go through mintPass(). */
export async function signPassToken(
  claims: PassClaims,
  ttlSeconds: number,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: claims.email, typ: claims.typ })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ttlSeconds)
    .sign(signingKey());
}

/**
 * Mints a pass of `kind`, persists its state row, and returns the signed
 * token. Reset passes carry ONLY the submitted email (K3) — account binding
 * happens later, on its pass_states row, at code verification.
 */
export async function mintPass(
  kind: PassKind,
  input: { accountId?: string; email: string },
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const supabase = getSupabase();
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + PASS_TTL_SECONDS[kind] * 1000);
  const token = await signPassToken(
    {
      sub: kind === "reset" ? input.email : (input.accountId ?? ""),
      email: input.email,
      typ: kind,
      jti,
    },
    PASS_TTL_SECONDS[kind],
  );

  if (kind === "session") {
    if (!input.accountId) throw new Error("Session pass requires an account id.");
    const { error } = await supabase.from("sessions").insert({
      id: jti,
      account_id: input.accountId,
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("pass_states").insert({
      jti,
      kind,
      email: input.email,
      account_id: input.accountId ?? null,
      expires_at: expiresAt.toISOString(),
    });
    if (error) throw error;
  }

  return { token, jti, expiresAt };
}

async function loadLivePassStateRow(
  claims: PassClaims,
): Promise<PassStateRow | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("pass_states")
    .select("*")
    .eq("jti", claims.jti)
    .maybeSingle();
  const row = data as PassStateRow | null;
  if (!row || row.kind !== claims.typ) return null;
  if (row.consumed_at !== null || row.dead_at !== null) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;
  if (row.email !== claims.email) return null;
  // Account binding integrity: a bound pass must point at a real account.
  if (row.account_id) {
    const { data: account } = await supabase
      .from("users")
      .select("id")
      .eq("id", row.account_id)
      .maybeSingle();
    if (!account) return null;
  }
  return row;
}

async function loadLiveSessionRow(
  claims: PassClaims,
): Promise<SessionRow | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", claims.jti)
    .maybeSingle();
  const row = data as SessionRow | null;
  if (!row || !sessionRowIsActive(row, Date.now())) return null;
  const { data: account } = await supabase
    .from("users")
    .select("id")
    .eq("id", row.account_id)
    .maybeSingle();
  if (!account) return null;
  return row;
}

/** Full guard chain for a pass of exactly `kind`; null means rejected.
 * Overloads let TypeScript narrow the row type per kind at call sites. */
export async function readValidPass(
  kind: "verify",
): Promise<Extract<VerifiedPass, { kind: "verify" }> | null>;
export async function readValidPass(
  kind: "reset",
): Promise<Extract<VerifiedPass, { kind: "reset" }> | null>;
export async function readValidPass(
  kind: "verify" | "reset",
): Promise<Extract<VerifiedPass, { kind: "verify" | "reset" }> | null>;
export async function readValidPass(
  kind: "session",
): Promise<Extract<VerifiedPass, { kind: "session" }> | null>;
export async function readValidPass(kind: PassKind): Promise<VerifiedPass | null> {
  try {
    // Auth checks are per-request by definition: stop any prerender/static
    // pass here so a cached shell can never bypass the guard.
    await connection();
    const cookieStore = await cookies();
    const token = cookieStore.get(PASS_COOKIE_NAMES[kind])?.value;
    if (!token) return null;

    const claims = await decodePassToken(token, kind);
    if (!claims) return null;

    if (kind === "session") {
      const row = await loadLiveSessionRow(claims);
      return row ? { kind, claims, row } : null;
    }
    const row = await loadLivePassStateRow(claims);
    return row ? { kind, claims, row } : null;
  } catch (error) {
    console.error("[pass] readValidPass failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Sets a pass cookie inside a Route Handler / Server Action context. */
export async function setPassCookie(
  kind: PassKind,
  token: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    PASS_COOKIE_NAMES[kind],
    token,
    cookieOptions(PASS_TTL_SECONDS[kind]),
  );
}

/** Clears the given pass cookies immediately (logout, leftovers, completion). */
export async function clearPassCookies(...kinds: PassKind[]): Promise<void> {
  const cookieStore = await cookies();
  for (const kind of kinds) {
    cookieStore.set(PASS_COOKIE_NAMES[kind], "", { ...cookieOptions(0), maxAge: 0 });
  }
}
