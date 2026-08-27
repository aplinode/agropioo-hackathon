"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangleIcon, ArrowRightIcon, CheckIcon } from "@/components/icons";
import type { FarmsBundle } from "../farms-bundle";

/* Add-farm form (UI-only demo): name, location, crop, and size.
   Saving is simulated — no backend is wired yet. */
export default function NewFarmForm({ bundle }: { bundle: FarmsBundle }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("idle");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    district?: string;
    crop?: string;
    acres?: string;
  }>({});

  const districts = [
    bundle.districts.multan,
    bundle.districts.sahiwal,
    bundle.districts.faisalabad,
    bundle.districts.vehari,
    bundle.districts.bahawalpur,
    bundle.districts.lodhran,
  ] as const;

  const crops = [
    bundle.crops.wheat,
    bundle.crops.cotton,
    bundle.crops.sugarcane,
    bundle.crops.maize,
    bundle.crops.rice,
  ] as const;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const district = String(data.get("district") ?? "");
    const crop = String(data.get("crop") ?? "");
    const acres = String(data.get("acres") ?? "").trim();

    const errors: typeof fieldErrors = {};
    if (!name) errors.name = bundle.new.errors.nameRequired;
    if (!district) errors.district = bundle.new.errors.districtRequired;
    if (!crop) errors.crop = bundle.new.errors.cropRequired;
    if (!acres || Number(acres) <= 0)
      errors.acres = bundle.new.errors.acresRequired;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    // Demo save. Swap for POST /api/farms once wired.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("saved");
  }

  const inputClass = (hasError?: string) =>
    `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      hasError
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
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
          {bundle.new.success.heading}
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
          {bundle.new.success.description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/farms")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
          >
            {bundle.new.success.goToFarms}
            <ArrowRightIcon size={16} />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint"
          >
            {bundle.new.success.backToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="farm-name" className="block text-sm font-semibold text-agro-ink">
          {bundle.new.fields.name}
        </label>
        <input
          id="farm-name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder={bundle.new.placeholders.name}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "farm-name-error" : undefined}
          className={inputClass(fieldErrors.name)}
        />
        {fieldError("farm-name-error", fieldErrors.name)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="farm-district" className="block text-sm font-semibold text-agro-ink">
            {bundle.new.fields.district}
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
              {bundle.new.placeholders.district}
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
            {bundle.new.fields.crop}
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
              {bundle.new.placeholders.crop}
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
          {bundle.new.fields.acres}
        </label>
        <input
          id="farm-acres"
          name="acres"
          type="number"
          inputMode="decimal"
          min={0.5}
          step={0.5}
          placeholder={bundle.new.placeholders.acres}
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
            {bundle.new.buttons.saving}
          </>
        ) : (
          <>
            {bundle.new.buttons.save}
            <ArrowRightIcon size={16} />
          </>
        )}
      </button>

      <p className="rounded-xl border-dashed border-agro-sprout bg-agro-mint px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        {bundle.new.demoNotice}
      </p>
    </form>
  );
}
