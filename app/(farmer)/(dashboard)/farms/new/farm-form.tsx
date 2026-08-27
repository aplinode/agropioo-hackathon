"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { createFarmSchema, type CreateFarmInput } from "@/lib/validation/farms";
import { PAKISTAN_DISTRICTS } from "@/lib/farms/districts";
import { CROPS } from "@/lib/farms/constants";
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
} from "@/components/icons";
import type { FarmsBundle } from "../farms-bundle";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function NewFarmForm({ bundle }: { bundle: FarmsBundle }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFarmInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createFarmSchema) as any,
    defaultValues: {
      name: '',
      location: '',
      district: PAKISTAN_DISTRICTS[0],
      crops: [],
      acres: 1,
      lat: 30.3753,
      lng: 69.3451,
    },
  });

  const selectedCrops = watch('crops') || [];

  const onSubmit = async (data: CreateFarmInput) => {
    setStatus('loading');
    setServerErrors({});
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        if (body.error?.issues) {
          const map: Record<string, string> = {};
          body.error.issues.forEach((i: Record<string, unknown>) => { map[(i.path as unknown as string[]).join('.')] = i.message as string; });
          setServerErrors(map);
        } else {
          setServerErrors({ form: body.error?.message || 'Failed to save' });
        }
        setStatus('error');
        return;
      }
      const farm = await res.json();
      setStatus('saved');
      setTimeout(() => router.push(`/farms/${farm.id}`), 600);
    } catch {
      setServerErrors({ form: 'Network error' });
      setStatus('error');
    }
  };

  if (status === 'saved') {
    return (
      <div className="flex flex-1 flex-col justify-center py-16" role="status">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-agro-canopy text-white" aria-hidden="true">
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

  const inputClass = (err?: string) =>
    `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      err ? 'border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20' : 'border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20'
    }`;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} noValidate className="space-y-5">
      <div>
        <label htmlFor="farm-name" className="block text-sm font-semibold text-agro-ink">{bundle.new.fields.name}</label>
        <input id="farm-name" {...register('name')} className={inputClass(errors.name?.message)} />
        {(errors.name || serverErrors.name) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.name?.message || serverErrors.name}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="farm-district" className="block text-sm font-semibold text-agro-ink">{bundle.new.fields.district}</label>
          <select id="farm-district" {...register('district')} className={`${inputClass(errors.district?.message)} appearance-none`}>
            {PAKISTAN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {(errors.district || serverErrors.district) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.district?.message || serverErrors.district}</p>}
        </div>
        <div>
          <label htmlFor="farm-acres" className="block text-sm font-semibold text-agro-ink">{bundle.new.fields.acres}</label>
          <input id="farm-acres" type="number" step="0.5" {...register('acres', { valueAsNumber: true })} className={inputClass(errors.acres?.message)} />
          {(errors.acres || serverErrors.acres) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.acres?.message || serverErrors.acres}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="farm-location" className="block text-sm font-semibold text-agro-ink">Location / Village</label>
        <input id="farm-location" {...register('location')} className={inputClass(errors.location?.message)} />
        {(errors.location || serverErrors.location) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.location?.message || serverErrors.location}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-agro-ink mb-1">Crops</label>
        <div className="flex flex-wrap gap-2">
          {CROPS.map((crop) => {
            const checked = selectedCrops.includes(crop);
            return (
              <label key={crop} className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm capitalize transition-colors ${checked ? 'border-agro-canopy bg-agro-mint text-agro-canopy' : 'border-agro-sprout bg-white text-agro-slate hover:border-agro-canopy'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  value={crop}
                  {...register('crops')}
                />
                {crop}
              </label>
            );
          })}
        </div>
        {(errors.crops || serverErrors.crops) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.crops?.message || serverErrors.crops}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-agro-ink mb-1">Farm Location</label>
        <div className="h-[300px] w-full overflow-hidden rounded-2xl border border-agro-sprout">
          <MapContainer center={[marker?.lat || 30.3753, marker?.lng || 69.3451]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            <MapPicker onPick={(lat, lng) => { setMarker({ lat, lng }); setValue('lat', lat); setValue('lng', lng); }} />
            {marker && <Marker position={[marker.lat, marker.lng]} />}
          </MapContainer>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-agro-slate"><MapPinIcon size={14} /> Tap map to set pin</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || status === 'loading'}
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === 'loading' ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
            {bundle.new.buttons.saving}
          </>
        ) : (
          <>
            {bundle.new.buttons.save}
            <ArrowRightIcon size={16} />
          </>
        )}
      </button>
      {(serverErrors.form || status === 'error') && <p className="text-center text-sm font-medium text-agro-forest">{serverErrors.form}</p>}
    </form>
  );
}
