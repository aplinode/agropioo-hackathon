"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const languages = [
  { code: "en", name: "English" },
  { code: "ur", name: "اردو" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "ps", name: "پښتو" },
  { code: "sd", name: "سڏھي" },
  { code: "sk", name: "سركي" },
  { code: "bal", name: "بلوچِي" },
  { code: "hi", name: "ھينڊو" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<{ code: string; name: string } | null>(null);

  const proceed = () => {
    if (selectedLanguage) {
      // Store selected language in localStorage for persistence
      localStorage.setItem("agropioo-language", selectedLanguage.code);
    }
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-agro-forest text-white p-4 sm:p-8">
      <div className="bg-white/10 rounded-3xl p-6 max-w-md w-full text-center sm:p-10 lg:p-12">
        <h2 className="display-heading font-display text-3xl font-bold text-agro-forest mb-6">
          Welcome to Agropioo
        </h2>
        <p className="text-agro-slate text-lg mb-8">
          Select your preferred language to get started.
        </p>

        <div className="space-y-3 mb-8">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang)}
              className={`w-full rounded-lg border border-white/20 hover:border-agro-canopy hover:text-agro-forest text-start text-sm font-medium transition-colors py-3`}
            >
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={proceed}
          className="w-full rounded-lg bg-agro-canopy text-agro-white text-sm font-medium py-3 transition-colors hover:bg-agro-forest"
        >
          Continue as {selectedLanguage?.name ?? "English"}
        </button>
      </div>
    </div>
  );
}