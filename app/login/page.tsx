import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Agropioo",
  description:
    "Sign in to Agropioo, the AI-powered farm intelligence platform. Your advisor, records, and advisories — waiting where you left them.",
};

export default function LoginPage() {
  return <LoginForm />;
}
