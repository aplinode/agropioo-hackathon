process.env.JWT_SECRET ??= "test-secret-key-for-vitest-only-0123456789";

import { afterAll, describe, expect, it } from "vitest";
import {
  PASS_TTL_SECONDS,
  decodePassToken,
  signPassToken,
  type PassClaims,
} from "@/lib/auth/pass";
import { sessionRowIsActive } from "@/lib/auth/logic";

/* Pass token round-trips (plan K1): mint → verify incl. expiry, wrong-type
   rejection, and tamper rejection — against the REAL sign/decode helpers.
   Row-state rules live in logic tests; here we pin the crypto contract. */

const claims: PassClaims = {
  sub: "11111111-1111-1111-1111-111111111111",
  email: "farmer@example.com",
  typ: "verify",
  jti: "22222222-2222-2222-2222-222222222222",
};

afterAll(() => {
  delete process.env.JWT_SECRET;
});

describe("pass tokens", () => {
  it("round-trips a valid token of the matching kind", async () => {
    const token = await signPassToken(claims, 60);
    const decoded = await decodePassToken(token, "verify");
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(claims.sub);
    expect(decoded?.email).toBe(claims.email);
    expect(decoded?.jti).toBe(claims.jti);
    expect(decoded?.typ).toBe("verify");
  });

  it("rejects a wrong-type pass exactly like a bad one (FR5)", async () => {
    const sessionToken = await signPassToken({ ...claims, typ: "session" }, 60);
    expect(await decodePassToken(sessionToken, "verify")).toBeNull();
    const verifyToken = await signPassToken({ ...claims, typ: "verify" }, 60);
    expect(await decodePassToken(verifyToken, "reset")).toBeNull();
    expect(await decodePassToken(verifyToken, "session")).toBeNull();
  });

  it("rejects a pass expired beyond the 30 s leeway", async () => {
    const token = await signPassToken(claims, -60); // expired 60 s ago
    expect(await decodePassToken(token, "verify")).toBeNull();
  });

  it("accepts a just-expired pass within the 30 s clock-skew leeway", async () => {
    const token = await signPassToken(claims, -20);
    expect(await decodePassToken(token, "verify")).not.toBeNull();
  });

  it("rejects tampered payloads and signatures", async () => {
    const token = await signPassToken(claims, 60);
    const [header] = token.split(".");
    // Forged body: same shape, different subject/email.
    const forgedPayload = Buffer.from(
      JSON.stringify({
        sub: "99999999-9999-9999-9999-999999999999",
        email: "attacker@example.com",
        typ: "verify",
      }),
    )
      .toString("base64url")
      .replace(/=+$/, "");
    expect(
      await decodePassToken(`${header}.${forgedPayload}.whatever`, "verify"),
    ).toBeNull();
    // Trailing garbage appended to a valid signature also fails.
    expect(await decodePassToken(`${token.slice(0, -2)}xx`, "verify")).toBeNull();
  });

  it("pins the fixed TTLs (plan: Library parameters)", () => {
    expect(PASS_TTL_SECONDS.verify).toBe(3600);
    expect(PASS_TTL_SECONDS.reset).toBe(3600);
    expect(PASS_TTL_SECONDS.session).toBe(7 * 24 * 3600);
  });

  it("session row liveness follows the pure rule (FR22)", () => {
    const now = Date.now();
    expect(
      sessionRowIsActive(
        { expires_at: new Date(now + 1000).toISOString(), revoked_at: null },
        now,
      ),
    ).toBe(true);
    expect(sessionRowIsActive(null, now)).toBe(false);
  });
});
