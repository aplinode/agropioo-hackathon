import { describe, expect, it } from "vitest";
import {
  codeSchema,
  forgotSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/auth";

describe("signupSchema", () => {
  const valid = {
    name: "  Muhammad Ahmad ",
    email: "  Farmer@Example.COM ",
    phone: "+92 300 1234567",
    password: "wheat-2026",
    confirmPassword: "wheat-2026",
    terms: true,
  };

  it("accepts a valid payload and normalizes email + name", () => {
    const parsed = signupSchema.parse(valid);
    expect(parsed.email).toBe("farmer@example.com");
    expect(parsed.name).toBe("Muhammad Ahmad");
  });

  it("coerces empty/missing phone to null", () => {
    const parsed = signupSchema.parse({ ...valid, phone: "" });
    expect(parsed.phone).toBeNull();
    const omitted = signupSchema.parse({ ...valid, phone: undefined });
    expect(omitted.phone).toBeNull();
  });

  it("rejects malformed phones", () => {
    expect(signupSchema.safeParse({ ...valid, phone: "abc" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, phone: "12" }).success).toBe(false);
  });

  it("rejects passwords shorter than 8 or longer than 64 chars", () => {
    expect(signupSchema.safeParse({ ...valid, password: "a".repeat(7), confirmPassword: "a".repeat(7) }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, password: "a".repeat(65), confirmPassword: "a".repeat(65) }).success).toBe(false);
  });

  it("rejects mismatched confirm password on the confirmPassword path", () => {
    const result = signupSchema.safeParse({ ...valid, confirmPassword: "different" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("requires terms acceptance", () => {
    expect(signupSchema.safeParse({ ...valid, terms: false }).success).toBe(false);
  });

  it("rejects invalid emails after normalization", () => {
    expect(signupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normalizes email and requires non-empty password", () => {
    const parsed = loginSchema.parse({ email: " A@B.COM ", password: "x" });
    expect(parsed.email).toBe("a@b.com");
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("forgotSchema", () => {
  it("normalizes email", () => {
    expect(forgotSchema.parse({ email: " X@Y.PK " }).email).toBe("x@y.pk");
  });
});

describe("codeSchema", () => {
  it("accepts exactly six digits and nothing else", () => {
    expect(codeSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(codeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(codeSchema.safeParse({ code: "1234567" }).success).toBe(false);
    expect(codeSchema.safeParse({ code: "12a456" }).success).toBe(false);
    expect(codeSchema.safeParse({}).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("enforces the same password rules plus match", () => {
    const base = { password: "cotton-2026", confirmPassword: "cotton-2026" };
    expect(resetPasswordSchema.safeParse(base).success).toBe(true);
    expect(
      resetPasswordSchema.safeParse({ ...base, confirmPassword: "nope" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });
});
