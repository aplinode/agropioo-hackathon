"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  CloudRainIcon,
  SproutIcon,
  FlaskIcon,
  BugIcon,
  WheatIcon,
} from "@/components/icons";
import { demoFarms } from "@/app/(farmer)/(dashboard)/dashboard/demo-data";
import type { FarmsBundle } from "@/app/(farmer)/(dashboard)/farms/farms-bundle";

/* Static demo date — ties to the dashboard's mock header date and keeps
   server/client markup identical. */
const DEMO_TODAY = "2026-08-23";

/* Field-record entry (UI-only demo): pick the event type, note what
   happened, save. Saving is simulated — no backend is wired yet. */
export default function NewRecordForm({ bundle }: { bundle: FarmsBundle }) {
  const router = useRouter();
  const [type, setType] = useState<string>("irrigation");
  const [date, setDate] = useState(DEMO_TODAY);
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("idle");
  const [fieldErrors, setFieldErrors] = useState<{
    farm?: string;
    date?: string;
  }>({});

  const recordTypes = [
    { id: "irrigation", label: bundle.records.types.irrigation, Icon: CloudRainIcon },
    { id: "fertilizer", label: bundle.records.types.fertilizer, Icon: SproutIcon },
    { id: "pesticide", label: bundle.records.types.pesticide, Icon: FlaskIcon },
    { id: "disease", label: bundle.records.types.disease, Icon: BugIcon },
    { id: "harvest", label: bundle.records.types.harvest, Icon: WheatIcon },
  ] as const;

  const titlePlaceholder =
    type === "irrigation"
      ? bundle.records.new.placeholders.titleIrrigation
      : bundle.records.new.placeholders.titleOther;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const data = new FormData(event.currentTarget);
    const farmId = String(data.get("farm") ?? "");
    const when = String(data.get("date") ?? "");

    const errors: typeof fieldErrors = {};
    if (!farmId) errors.farm = bundle.records.new.errors.farmRequired;
    if (!when) errors.date = bundle.records.new.errors.dateRequired;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    // Demo save. Swap for POST /api/farms/[id]/records once wired.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setStatus("saved");
  }

  const inputClass = (hasError?: string) =>
    `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      hasError
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

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
          {bundle.records.new.success.heading}
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
          {bundle.records.new.success.description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
          >
            {bundle.records.new.success.backToDashboard}
            <ArrowRightIcon size={16} />
          </Link>
          <button
            type="button"
            onClick={() => router.push("/farms")}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors hover:border-agro-canopy hover:bg-agro-mint"
          >
            {bundle.records.new.success.viewFarms}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Event type */}
      <fieldset>
        <legend className="text-sm font-semibold text-agro-ink">
          {bundle.records.new.fields.type}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {recordTypes.map(({ id, label, Icon }) => {
            const active = type === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setType(id)}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-agro-canopy text-white"
                    : "border border-agro-sprout bg-white text-agro-slate hover:border-agro-canopy hover:text-agro-canopy"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="record-farm" className="block text-sm font-semibold text-agro-ink">
            {bundle.records.new.fields.farm}
          </label>
          <select
            id="record-farm"
            name="farm"
            defaultValue=""
            aria-invalid={Boolean(fieldErrors.farm)}
            aria-describedby={fieldErrors.farm ? "record-farm-error" : undefined}
            className={`${inputClass(fieldErrors.farm)} appearance-none`}
          >
            <option value="" disabled>
              {bundle.records.new.placeholders.farm}
            </option>
            {demoFarms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
          {fieldErrors.farm && (
            <p
              id="record-farm-error"
              className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink"
            >
              <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-agro-forest" />
              {fieldErrors.farm}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="record-date" className="block text-sm font-semibold text-agro-ink">
            {bundle.records.new.fields.date}
          </label>
          <input
            id="record-date"
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={Boolean(fieldErrors.date)}
            aria-describedby={fieldErrors.date ? "record-date-error" : undefined}
            className={`${inputClass(fieldErrors.date)} [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
          />
          {fieldErrors.date && (
            <p
              id="record-date-error"
              className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-agro-ink"
            >
              <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-agro-forest" />
              {fieldErrors.date}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="record-title" className="block text-sm font-semibold text-agro-ink">
          {bundle.records.new.fields.title} <span className="font-normal text-agro-slate">{bundle.records.new.fields.optional}</span>
        </label>
        <input
          id="record-title"
          name="title"
          type="text"
          autoComplete="off"
          placeholder={titlePlaceholder}
          className={inputClass()}
        />
      </div>

      <div>
        <label htmlFor="record-note" className="block text-sm font-semibold text-agro-ink">
          {bundle.records.new.fields.details} <span className="font-normal text-agro-slate">{bundle.records.new.fields.optional}</span>
        </label>
        <textarea
          id="record-note"
          name="note"
          rows={3}
          placeholder={bundle.records.new.placeholders.details}
          className="focus-ring-none mt-2 w-full rounded-xl border border-agro-sprout bg-white px-4 py-3 text-sm leading-relaxed text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud outline-none focus:ring-2 focus:border-agro-canopy focus:ring-agro-canopy/20"
        />
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
            {bundle.records.new.buttons.saving}
          </>
        ) : (
          <>
            {bundle.records.new.buttons.save}
            <ArrowRightIcon size={16} />
          </>
        )}
      </button>

      <p className="rounded-xl border-dashed border-agro-sprout bg-agro-mint px-4 py-2.5 text-center font-mono text-xs tracking-wide text-agro-slate">
        {bundle.records.new.demoNotice}
      </p>
    </form>
  );
}
