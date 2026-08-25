import { describe, expect, it } from "vitest";
import {
  applyWrongEntry,
  codeMatches,
  decideLoginRedirect,
  generateCode,
  isResendInCooldown,
  latestCodeVerdict,
  maskEmail,
  sessionRowIsActive,
  sha256Hex,
  type CodeRowLike,
} from "@/lib/auth/logic";

const NOW = 1_800_000_000_000;

function codeRow(overrides: Partial<CodeRowLike> = {}): CodeRowLike {
  return {
    code_hash: sha256Hex("123456"),
    wrong_count: 0,
    created_at: new Date(NOW - 60_000).toISOString(),
    consumed_at: null,
    dead_at: null,
    voided_at: null,
    expires_at: new Date(NOW + 9 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe("maskEmail", () => {
  it("shows the first local character and hides the rest", () => {
    expect(maskEmail("ahmad@gmail.com")).toBe("a•••@gmail.com");
    expect(maskEmail("x@y.pk")).toBe("x•••@y.pk");
  });
  it("degrades safely on malformed input", () => {
    expect(maskEmail("@weird")).toBe("•••@@weird");
  });
});

describe("generateCode + sha256Hex", () => {
  it("produces six-digit numeric strings with stable hashes", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
    expect(sha256Hex("123456")).toHaveLength(64);
    expect(sha256Hex("123456")).toBe(sha256Hex("123456"));
    expect(sha256Hex("123456")).not.toBe(sha256Hex("123457"));
  });
});

describe("latestCodeVerdict", () => {
  it("classifies missing and live codes", () => {
    expect(latestCodeVerdict(null, NOW)).toBe("none");
    expect(latestCodeVerdict(codeRow(), NOW)).toBe("open");
  });

  it("classifies expired / dead / voided / consumed codes", () => {
    const expired = codeRow({ expires_at: new Date(NOW - 1).toISOString() });
    const dead = codeRow({ dead_at: new Date(NOW - 1).toISOString() });
    const voided = codeRow({ voided_at: new Date(NOW - 1).toISOString() });
    const consumed = codeRow({ consumed_at: new Date(NOW - 1).toISOString() });
    expect(latestCodeVerdict(expired, NOW)).toBe("expired");
    expect(latestCodeVerdict(dead, NOW)).toBe("dead");
    expect(latestCodeVerdict(voided, NOW)).toBe("voided");
    expect(latestCodeVerdict(consumed, NOW)).toBe("voided");
  });

  it("treats expiry strictly by server time", () => {
    const boundary = codeRow({ expires_at: new Date(NOW).toISOString() });
    expect(latestCodeVerdict(boundary, NOW)).toBe("expired");
  });
});

describe("codeMatches", () => {
  it("compares the candidate against the stored hash only", () => {
    expect(codeMatches(codeRow(), "123456")).toBe(true);
    expect(codeMatches(codeRow(), "654321")).toBe(false);
  });
});

describe("applyWrongEntry", () => {
  it("kills the current code at the 5th wrong entry", () => {
    const fourth = applyWrongEntry(3, 3);
    expect(fourth.codeNowDead).toBe(false);
    const fifth = applyWrongEntry(4, 4);
    expect(fifth.codeNowDead).toBe(true);
    expect(fifth.passNowDead).toBe(false);
  });

  it("kills the whole pass at the 10th cumulative entry across resends (FR14)", () => {
    // Fresh code after resend resets per-code count but not the pass total.
    const ninth = applyWrongEntry(0, 8);
    expect(ninth.codeNowDead).toBe(false);
    expect(ninth.passNowDead).toBe(false);
    const tenth = applyWrongEntry(0, 9);
    expect(tenth.passNowDead).toBe(true);
  });
});

describe("isResendInCooldown", () => {
  it("blocks resends inside 60 s of the newest non-voided code", () => {
    const recent = codeRow({ created_at: new Date(NOW - 59_000).toISOString() });
    const old = codeRow({ created_at: new Date(NOW - 61_000).toISOString() });
    expect(isResendInCooldown(recent.created_at, NOW)).toBe(true);
    expect(isResendInCooldown(old.created_at, NOW)).toBe(false);
    expect(isResendInCooldown(null, NOW)).toBe(false);
  });
});

describe("decideLoginRedirect", () => {
  it("sends verified farmers straight to the farm dashboard (PR #16)", () => {
    expect(decideLoginRedirect()).toBe("/dashboard");
  });
});

describe("sessionRowIsActive", () => {
  it("requires un-revoked and un-expired rows", () => {
    const live = { expires_at: new Date(NOW + 1000).toISOString(), revoked_at: null };
    const revoked = { ...live, revoked_at: new Date(NOW - 1000).toISOString() };
    const expired = { ...live, expires_at: new Date(NOW - 1000).toISOString() };
    expect(sessionRowIsActive(live, NOW)).toBe(true);
    expect(sessionRowIsActive(revoked, NOW)).toBe(false);
    expect(sessionRowIsActive(expired, NOW)).toBe(false);
    expect(sessionRowIsActive(null, NOW)).toBe(false);
  });
});
