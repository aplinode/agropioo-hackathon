"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, ArrowRightIcon, CheckIcon } from "@/components/icons";

const districts = [
  "Multan",
  "Sahiwal",
  "Faisalabad",
  "Vehari",
  "Bahawalpur",
  "Lodhran",
] as const;

const crops = ["Wheat", "Cotton", "Sugarcane", "Maize", "Rice"] as const;

/* Add-farm form (UI-only demo): name, location, crop, and size.
   Saving is simulated — no backend is wired yet. */
export default function NewFarmForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("idle");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    district?: string;
    crop?: string;
    acres?: string;
  }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const district = String(data.get("district") ?? "");
    const crop = String(data.get("crop") ?? "");
    const acres = String(data.get("acres") ?? "").trim();

    const errors: typeof fieldErrors = {};
    if (!name) errors.name = "Give your farm a name.";
    if (!district) errors.district = "Pick the district.";
    if (!crop) errors.crop = "Pick the main crop.";
    if (!acres || Number(acres) <= 0)
      errors.acres = "Enter the area in acres.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    // Demo save. Swap for POST /api/farms once wired.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("saved");
  }

  const inputClass = (hasError?: string) =>
    `mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      hasError
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-clay focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

  function fieldError(id: string, message?: string) {
    if (!message) return null;
    return (
      <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink">
        <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-agro-forest" />
        {message}
      </p>
    );
  }

  if (status === "saved") {
    return (
      <div className="flex flex-1 flex-col justify-center py-16" role="status">
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-agro-canopy text-white"
          aria-hidden="true"
        >
          <CheckIcon size={26} />
        </span>
        <h2 className="display-heading mt-5 font-display text-3xl font-bold tracking-tight text-agro-ink">
          Farm saved in demo
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
          In the full build this farm would now appear on your dashboard and
          start shaping your advisories.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/farms")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
          >
            Go to my farms
            <ArrowRightIcon size={16} />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="farm-name" className="block text-sm font-semibold text-agro-ink">
          Farm name
        </label>
        <input
          id="farm-name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder="e.g. Khalilpur Farm"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "farm-name-error" : undefined}
          className={inputClass(fieldErrors.name)}
        />
        {fieldError("farm-name-error", fieldErrors.name)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="farm-district" className="block text-sm font-semibold text-agro-ink">
            District
          </label>
          <select
            id="farm-district"
            name="district"
            defaultValue=""
            aria-invalid={Boolean(fieldErrors.district)}
            aria-describedby={fieldErrors.district ? "farm-district-error" : undefined}
            className={`${inputClass(fieldErrors.district)} appearance-none`}
          >
            <option value="" disabled>
              Choose district
            </option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
          {fieldError("farm-district-error", fieldErrors.district)}
        </div>

        <div>
          <label htmlFor="farm-crop" className="block text-sm font-semibold text-agro-ink">
            Main crop
          </label>
          <select
            id="farm-crop"
            name="crop"
            defaultValue=""
            aria-invalid={Boolean(fieldErrors.crop)}
            aria-describedby={fieldErrors.crop ? "farm-crop-error" : undefined}
            className={`${inputClass(fieldErrors.crop)} appearance-none`}
          >
            <option value="" disabled>
              Choose crop
            </option>
            {crops.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
          {fieldError("farm-crop-error", fieldErrors.crop)}
        </div>
      </div>

      <div>
        <label htmlFor="farm-acres" className="block text-sm font-semibold text-agro-ink">
          Area (acres)
        </label>
        <input
          id="farm-acres"
          name="acres"
          type="number"
          inputMode="decimal"
          min={0.5}
          step={0.5}
          placeholder="e.g. 12.5"
          aria-invalid={Boolean(fieldErrors.acres)}
          aria-describedby={fieldErrors.acres ? "farm-acres-error" : undefined}
          className={inputClass(fieldErrors.acres)}
        />
        {fieldError("farm-acres-error", fieldErrors.acres)}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
              <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Saving…
          </>
        ) : (
          <>
            Save farm
            <ArrowRightIcon size={16} />
          </>
        )}
      </button>

      <p className="rounded-xl border border-dashed border-agro-cloud/70 bg-agro-stone px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        DEMO · saving isn&apos;t wired to a database yet
      </p>
    </form>
  );
}
