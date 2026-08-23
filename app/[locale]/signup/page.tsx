import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
  title: "Create account — Agropioo",
  description:
    "Create your Agropioo account: a personalised AI advisor, weather-aware guidance, and farm records that sharpen every season. Built for Pakistan.",
};

export default function SignupPage() {
  return <SignupForm />;
}
