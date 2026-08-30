"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import type { PricesBundle } from "../prices-bundle";

type CropOption = { id: string; name_en: string };
type MandiOption = { id: string; name_en: string; district: string };

const adminSchema = z.object({
  crop_id: z.string().min(1, "Crop is required"),
  mandi_id: z.string().min(1, "Mandi is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  modal_price: z.number().positive("Must be positive"),
  min_price: z.number().positive("Must be positive"),
  max_price: z.number().positive("Must be positive"),
  is_holiday: z.boolean(),
});

type AdminFormData = z.infer<typeof adminSchema>;

interface AdminFormProps {
  bundle: PricesBundle;
  crops: CropOption[];
  mandis: MandiOption[];
}

export default function AdminForm({ bundle, crops, mandis }: AdminFormProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      is_holiday: false,
      crop_id: searchParams.get("crop") ?? "",
      mandi_id: searchParams.get("mandi") ?? "",
      modal_price: 0,
      min_price: 0,
      max_price: 0,
    },
  });

  async function onSubmit(data: AdminFormData) {
    if (data.min_price > data.modal_price || data.max_price < data.modal_price) {
      setStatus("error");
      setErrorMessage("Modal price must be between min and max price.");
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "same-origin",
      });

      const result = (await res.json()) as { success?: boolean; error?: { message: string } };

      if (!res.ok || result.error) {
        setStatus("error");
        setErrorMessage(result.error?.message ?? "Failed to save price.");
        return;
      }

      setStatus("saved");
      reset({
        crop_id: data.crop_id,
        mandi_id: data.mandi_id,
        date: new Date().toISOString().split("T")[0],
        modal_price: 0,
        min_price: 0,
        max_price: 0,
        is_holiday: false,
      });
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20";
  const labelClass = "block text-sm font-medium text-agro-forest";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="crop_id" className={labelClass}>
          Crop
        </label>
        <select id="crop_id" {...register("crop_id")} className={inputClass}>
          <option value="">Select crop</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name_en}
            </option>
          ))}
        </select>
        {errors.crop_id ? <p className="mt-1 text-xs text-agro-error">{errors.crop_id.message}</p> : null}
      </div>

      <div>
        <label htmlFor="mandi_id" className={labelClass}>
          Mandi
        </label>
        <select id="mandi_id" {...register("mandi_id")} className={inputClass}>
          <option value="">Select mandi</option>
          {mandis.map((mandi) => (
            <option key={mandi.id} value={mandi.id}>
              {mandi.name_en} — {mandi.district}
            </option>
          ))}
        </select>
        {errors.mandi_id ? <p className="mt-1 text-xs text-agro-error">{errors.mandi_id.message}</p> : null}
      </div>

      <div>
        <label htmlFor="date" className={labelClass}>
          {bundle.adminDate}
        </label>
        <input id="date" type="date" {...register("date")} className={inputClass} />
        {errors.date ? <p className="mt-1 text-xs text-agro-error">{errors.date.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="modal_price" className={labelClass}>
            {bundle.adminModalPrice}
          </label>
          <input
            id="modal_price"
            type="number"
            step="0.01"
            {...register("modal_price", { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.modal_price ? (
            <p className="mt-1 text-xs text-agro-error">{errors.modal_price.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="min_price" className={labelClass}>
            {bundle.adminMinPrice}
          </label>
          <input id="min_price" type="number" step="0.01" {...register("min_price", { valueAsNumber: true })} className={inputClass} />
          {errors.min_price ? (
            <p className="mt-1 text-xs text-agro-error">{errors.min_price.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="max_price" className={labelClass}>
            {bundle.adminMaxPrice}
          </label>
          <input id="max_price" type="number" step="0.01" {...register("max_price", { valueAsNumber: true })} className={inputClass} />
          {errors.max_price ? (
            <p className="mt-1 text-xs text-agro-error">{errors.max_price.message}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-agro-sprout bg-white p-3">
        <input type="checkbox" {...register("is_holiday")} className="h-5 w-5 accent-agro-canopy" />
        <span className="text-sm font-medium text-agro-forest">{bundle.adminHoliday}</span>
      </label>

      {status === "error" && errorMessage ? (
        <p className="rounded-xl bg-agro-error/10 p-3 text-sm text-agro-error">{errorMessage}</p>
      ) : null}
      {status === "saved" ? (
        <p className="rounded-xl bg-agro-mint p-3 text-sm text-agro-canopy">Price saved.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-agro-canopy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:cursor-wait disabled:opacity-70"
      >
        {status === "saving" ? "Saving..." : bundle.adminSave}
      </button>
    </form>
  );
}
