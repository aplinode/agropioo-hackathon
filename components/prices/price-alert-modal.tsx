"use client";

import { useState } from "react";
import type { PricesBundle } from "@/app/(farmer)/(dashboard)/prices/prices-bundle";

type MandiOption = { id: string; name_en: string };
type CropOption = { id: string; name_en: string };

export interface AlertFormData {
  id?: string;
  crop_id: string;
  mandi_id: string;
  target_price_pkr: number;
  status: "active" | "paused";
}

export interface SavedAlert extends AlertFormData {
  id: string;
  crop_name_en: string;
  mandi_name_en: string | null;
}

interface PriceAlertModalProps {
  bundle: PricesBundle;
  crops: CropOption[];
  mandis: MandiOption[];
  initial?: SavedAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AlertFormData) => void;
  onDelete?: (id: string) => void;
  isPending?: boolean;
}

export default function PriceAlertModal({
  bundle,
  crops,
  mandis,
  initial,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isPending,
}: PriceAlertModalProps) {
  const [cropId, setCropId] = useState(initial?.crop_id ?? "");
  const [mandiId, setMandiId] = useState(initial?.mandi_id ?? "");
  const [target, setTarget] = useState(initial ? String(initial.target_price_pkr) : "");
  const [status, setStatus] = useState<"active" | "paused">(initial?.status ?? "active");

  if (!isOpen) return null;

  const isEditing = Boolean(initial?.id);
  const canSubmit = cropId && target && Number(target) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSave({
      id: initial?.id,
      crop_id: cropId,
      mandi_id: mandiId,
      target_price_pkr: Number(target),
      status,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-agro-night/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
        <h2 id="alert-modal-title" className="text-lg font-bold text-agro-forest">
          {isEditing ? bundle.editAlert : bundle.setAlert}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="alert-crop" className="block text-sm font-medium text-agro-slate">
              {bundle.alertCrop}
            </label>
            <select
              id="alert-crop"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
            >
              <option value="">{bundle.selectCrop}</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name_en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-mandi" className="block text-sm font-medium text-agro-slate">
              {bundle.alertMandiOptional}
            </label>
            <select
              id="alert-mandi"
              value={mandiId}
              onChange={(e) => setMandiId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
            >
              <option value="">{bundle.alertMandi}</option>
              {mandis.map((mandi) => (
                <option key={mandi.id} value={mandi.id}>
                  {mandi.name_en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-target" className="block text-sm font-medium text-agro-slate">
              {bundle.targetPrice}
            </label>
            <input
              id="alert-target"
              type="number"
              min={1}
              step={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-agro-slate">{bundle.alertStatus}</span>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-2 text-sm text-agro-ink">
                <input
                  type="radio"
                  name="alert-status"
                  value="active"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="text-agro-canopy focus:ring-agro-canopy"
                />
                {bundle.alertActive}
              </label>
              <label className="flex items-center gap-2 text-sm text-agro-ink">
                <input
                  type="radio"
                  name="alert-status"
                  value="paused"
                  checked={status === "paused"}
                  onChange={() => setStatus("paused")}
                  className="text-agro-canopy focus:ring-agro-canopy"
                />
                {bundle.alertPaused}
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="inline-flex justify-center rounded-xl bg-agro-canopy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-agro-forest disabled:bg-agro-sprout"
            >
              {isPending ? bundle.loading : bundle.saveAlert}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex justify-center rounded-xl border border-agro-sprout bg-white px-4 py-2.5 text-sm font-semibold text-agro-ink transition-colors hover:bg-agro-paper"
            >
              {bundle.cancel}
            </button>
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => initial?.id && onDelete(initial.id)}
                disabled={isPending}
                className="inline-flex justify-center rounded-xl bg-agro-wheat/20 px-4 py-2.5 text-sm font-semibold text-agro-earth transition-colors hover:bg-agro-wheat/40"
              >
                {bundle.deleteAlert}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
