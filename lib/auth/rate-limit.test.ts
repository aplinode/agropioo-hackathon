import { afterEach, describe, expect, it } from "vitest";
import { __resetRateLimitsForTests, RATE_RULES, hitLimiter } from "@/lib/auth/rate-limit";

afterEach(() => {
  __resetRateLimitsForTests();
});

describe("hitLimiter", () => {
  it("allows requests up to the limit, then blocks within the window", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_RULES.loginIp.limit; i += 1) {
      expect(hitLimiter("login:ip", "1.2.3.4", RATE_RULES.loginIp.limit, RATE_RULES.loginIp.windowMs, t0)).toBe(true);
    }
    expect(hitLimiter("login:ip", "1.2.3.4", RATE_RULES.loginIp.limit, RATE_RULES.loginIp.windowMs, t0 + 1000)).toBe(false);
  });

  it("opens a fresh fixed window after the previous one elapses", () => {
    const t0 = 2_000_000;
    for (let i = 0; i < RATE_RULES.forgotIp.limit; i += 1) {
      hitLimiter("forgot:ip", "5.6.7.8", RATE_RULES.forgotIp.limit, RATE_RULES.forgotIp.windowMs, t0);
    }
    expect(hitLimiter("forgot:ip", "5.6.7.8", RATE_RULES.forgotIp.limit, RATE_RULES.forgotIp.windowMs, t0 + RATE_RULES.forgotIp.windowMs - 1)).toBe(false);
    expect(hitLimiter("forgot:ip", "5.6.7.8", RATE_RULES.forgotIp.limit, RATE_RULES.forgotIp.windowMs, t0 + RATE_RULES.forgotIp.windowMs)).toBe(true);
  });

  it("tracks dimensions independently (IP vs email vs pass)", () => {
    const t0 = 3_000_000;
    // Exhaust the per-email dimension…
    for (let i = 0; i < RATE_RULES.signupEmail.limit; i += 1) {
      hitLimiter("signup:email", "farmer@example.com", RATE_RULES.signupEmail.limit, RATE_RULES.signupEmail.windowMs, t0);
    }
    expect(hitLimiter("signup:email", "farmer@example.com", RATE_RULES.signupEmail.limit, RATE_RULES.signupEmail.windowMs, t0)).toBe(false);
    // …without touching the same account from another IP dimension…
    expect(hitLimiter("signup:ip", "9.9.9.9", RATE_RULES.signupIp.limit, RATE_RULES.signupIp.windowMs, t0)).toBe(true);
    // …or other accounts on the shared IP.
    expect(hitLimiter("signup:email", "other@example.com", RATE_RULES.signupEmail.limit, RATE_RULES.signupEmail.windowMs, t0)).toBe(true);
  });

  it("keeps separate buckets per scope", () => {
    const t0 = 4_000_000;
    expect(hitLimiter("code-check:pass", "jti-1", 1, 60_000, t0)).toBe(true);
    expect(hitLimiter("resend:pass", "jti-1", 1, 60_000, t0)).toBe(true);
    expect(hitLimiter("code-check:pass", "jti-1", 1, 60_000, t0)).toBe(false);
  });

  it("limits detect requests to 10 per hour per IP", () => {
    const t0 = 5_000_000;
    const { limit, windowMs } = RATE_RULES.detectIp;
    for (let i = 0; i < limit; i += 1) {
      expect(
        hitLimiter("detect:ip", "10.0.0.1", limit, windowMs, t0),
      ).toBe(true);
    }
    expect(
      hitLimiter("detect:ip", "10.0.0.1", limit, windowMs, t0 + 1000),
    ).toBe(false);
  });
});
