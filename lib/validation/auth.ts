/* Shared Zod schemas for every auth surface (plan K11): forms validate with
   the SAME schemas Route Handlers re-validate with, so client and server can
   never drift. Email is trimmed + lowercased here — before EVERY comparison
   and before storage. */

import { z } from "zod";

export const normalizedEmailSchema = z
  .string({ message: "Enter your email address." })
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email({ message: "Enter a valid email address." }));

const passwordSchema = z
  .string({ message: "Choose a password." })
  .min(8, "Use at least 8 characters.")
  .max(64, "Use at most 64 characters.");

const phonePattern = /^[+\d][\d\s-]{7,14}$/;

export const signupSchema = z
  .object({
    name: z
      .string({ message: "Enter your full name." })
      .trim()
      .min(1, "Enter your full name.")
      .max(80, "Use at most 80 characters."),
    email: normalizedEmailSchema,
    phone: z
      .string()
      .optional()
      .transform((value) => {
        const trimmed = (value ?? "").trim();
        return trimmed.length === 0 ? null : trimmed;
      })
      .pipe(
        z
          .string()
          .regex(phonePattern, "Enter a valid phone number.")
          .nullable(),
      ),
    password: passwordSchema,
    confirmPassword: z.string({ message: "Repeat your password." }),
    terms: z.boolean().refine((value) => value === true, {
      message: "Please accept the terms to continue.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string({ message: "Enter your password." }).min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({
  email: normalizedEmailSchema,
});

export type ForgotInput = z.infer<typeof forgotSchema>;

/** Exactly six digits, numeric only (FR13). */
export const codeSchema = z.object({
  code: z
    .string({ message: "Enter the 6-digit code." })
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export type CodeInput = z.infer<typeof codeSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ message: "Repeat your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
