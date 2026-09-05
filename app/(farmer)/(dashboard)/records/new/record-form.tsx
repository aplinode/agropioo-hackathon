"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecordSchema, type CreateRecordInput } from "@/lib/validation/farms";
import { RECORD_TYPES, SEASONS, YEAR_OPTIONS, WEATHER_CONDITIONS } from "@/lib/farms/constants";
import { generateClientUuid, queueWrite } from "@/lib/offline/queue-helpers";
import type { FarmsBundle } from "@/app/(farmer)/(dashboard)/farms/farms-bundle";
import {
  ArrowRightIcon,
  CheckIcon,
} from "@/components/icons";


export default function RecordForm({ bundle, defaultFarmId }: { bundle: FarmsBundle; defaultFarmId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle');
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [lockedFarmName, setLockedFarmName] = useState<string | null>(null);
  const [weatherOverride, setWeatherOverride] = useState<string>('');
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const clientUuidRef = useRef(generateClientUuid());
  const isFarmLocked = Boolean(defaultFarmId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecordInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createRecordSchema) as any,
    defaultValues: {
      farm_id: defaultFarmId || '',
      type: 'irrigation',
      season: 'Summer',
      year: YEAR_OPTIONS[10],
      event_date: new Date().toISOString().split('T')[0],
      title: '',
      note: '',
      weather_condition: null,
      yield_qty: null,
      labor_cost: null,
      transport_cost: null,
    },
  });

  const selectedType = watch('type');
  const isHarvest = selectedType === 'harvest';

  useEffect(() => {
    fetch('/api/farms')
      .then((r) => r.json())
      .then((data: Array<Record<string, unknown>>) => {
        const active = data
          .filter((f) => !f.archived_at)
          .map((f) => ({ id: String(f.id), name: String(f.name) }));
        setFarms(active);
        if (defaultFarmId) {
          const match = active.find((f) => f.id === defaultFarmId);
          setLockedFarmName(match ? match.name : null);
        }
      })
      .catch(() => {});
  }, [defaultFarmId]);

  useEffect(() => {
    if (!defaultFarmId || lockedFarmName !== null || farms.length === 0) return;
    if (lockedFarmName === null) {
      fetch(`/api/farms/${defaultFarmId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && !data.archived_at) setLockedFarmName(String(data.name));
        })
        .catch(() => {});
    }
  }, [defaultFarmId, lockedFarmName, farms.length]);

  const onSubmit = async (data: CreateRecordInput) => {
    setStatus('loading');
    setServerErrors({});
    setQueuedMessage(null);
    try {
      const payload = { ...data, client_uuid: clientUuidRef.current };
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json() as Record<string, unknown>;
        const errorBody = body.error as Record<string, unknown> | undefined;
        if (errorBody?.issues) {
          const map: Record<string, string> = {};
          (errorBody.issues as Record<string, unknown>[]).forEach((i) => { map[(i.path as unknown as string[]).join('.')] = i.message as string; });
          setServerErrors(map);
        } else {
          setServerErrors({ form: (errorBody?.message as string | undefined) || 'Failed to save' });
        }
        setStatus('error');
        return;
      }
      await res.json();
      setStatus('saved');
      setTimeout(() => router.push('/farms'), 600);
    } catch {
      await queueWrite({
        url: '/api/records',
        method: 'POST',
        body: JSON.stringify({ ...data, client_uuid: clientUuidRef.current }),
      });
      setQueuedMessage('Saved offline — will sync when you are back online.');
      setStatus('saved');
    }
  };

  if (status === 'saved') {
    return (
      <div className="flex flex-1 flex-col justify-center py-16" role="status">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-agro-canopy text-white" aria-hidden="true">
          <CheckIcon size={26} />
        </span>
        <h2 className="display-heading mt-5 font-display text-3xl font-bold tracking-tight text-agro-ink">
          Record saved
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
          {bundle.records.new.success.description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => router.push('/farms')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0">
            {bundle.records.new.success.viewFarms}
            <ArrowRightIcon size={16} />
          </button>
          <button type="button" onClick={() => setStatus('idle')} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint">
            Log another
          </button>
        </div>
      </div>
    );
  }

  const inputClass = (err?: string) =>
    `focus-ring-none mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      err ? 'border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20' : 'border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20'
    }`;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} noValidate className="space-y-5">
      <div>
        <label htmlFor="record-farm" className="block text-sm font-semibold text-agro-ink">{bundle.records.new.fields.farm}</label>
        {isFarmLocked ? (
          <div className="mt-2">
            {lockedFarmName === null ? (
              <div className="flex h-12 items-center rounded-xl border border-agro-sprout/60 bg-agro-cloud px-4 text-sm text-agro-slate">
                Loading farm…
              </div>
            ) : (
              <div className="flex h-12 items-center rounded-xl border border-agro-sprout/60 bg-agro-cloud px-4 text-sm text-agro-slate">
                {lockedFarmName}
              </div>
            )}
            <input type="hidden" id="record-farm" {...register('farm_id')} />
          </div>
        ) : (
          <>
            <select id="record-farm" {...register('farm_id')} className={`${inputClass(errors.farm_id?.message)} appearance-none`}>
              <option value="">Select a farm</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {(errors.farm_id || serverErrors.farm_id) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.farm_id?.message || serverErrors.farm_id}</p>}
          </>
        )}
        {isFarmLocked && (errors.farm_id || serverErrors.farm_id) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.farm_id?.message || serverErrors.farm_id}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="record-type" className="block text-sm font-semibold text-agro-ink">{bundle.records.new.fields.type}</label>
          <select id="record-type" {...register('type')} className={inputClass(errors.type?.message)}>
            {RECORD_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          {(errors.type || serverErrors.type) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.type?.message || serverErrors.type}</p>}
        </div>
        <div>
          <label htmlFor="record-date" className="block text-sm font-semibold text-agro-ink">{bundle.records.new.fields.date}</label>
          <input id="record-date" type="date" {...register('event_date')} className={inputClass(errors.event_date?.message)} />
          {(errors.event_date || serverErrors.event_date) && <p className="mt-1.5 text-sm font-medium text-agro-forest">{errors.event_date?.message || serverErrors.event_date}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="record-season" className="block text-sm font-semibold text-agro-ink">Season</label>
          <select id="record-season" {...register('season')} className={inputClass(errors.season?.message)}>
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="record-year" className="block text-sm font-semibold text-agro-ink">Year</label>
          <select id="record-year" {...register('year')} className={inputClass(errors.year?.message)}>
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="record-title" className="block text-sm font-semibold text-agro-ink">{bundle.records.new.fields.title} <span className="text-agro-slate font-normal">({bundle.records.new.fields.optional})</span></label>
        <input id="record-title" {...register('title')} className={inputClass(errors.title?.message)} />
      </div>

      <div>
        <label htmlFor="record-note" className="block text-sm font-semibold text-agro-ink">{bundle.records.new.fields.details}</label>
        <textarea id="record-note" rows={3} {...register('note')} className={`${inputClass(errors.note?.message)} resize-y`} />
      </div>

      {isHarvest && (
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="record-yield" className="block text-sm font-semibold text-agro-ink">Yield Qty</label>
            <input id="record-yield" type="number" step="0.01" {...register('yield_qty', { valueAsNumber: true })} className={inputClass(errors.yield_qty?.message)} />
          </div>
          <div>
            <label htmlFor="record-labor" className="block text-sm font-semibold text-agro-ink">Labor Cost</label>
            <input id="record-labor" type="number" step="0.01" {...register('labor_cost', { valueAsNumber: true })} className={inputClass(errors.labor_cost?.message)} />
          </div>
          <div>
            <label htmlFor="record-transport" className="block text-sm font-semibold text-agro-ink">Transport Cost</label>
            <input id="record-transport" type="number" step="0.01" {...register('transport_cost', { valueAsNumber: true })} className={inputClass(errors.transport_cost?.message)} />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="record-weather" className="block text-sm font-semibold text-agro-ink">Weather Condition</label>
        <select
          id="record-weather"
          value={weatherOverride}
          onChange={(e) => {
            const val = e.target.value;
            setWeatherOverride(val);
            setValue('weather_condition', (val || null) as unknown as CreateRecordInput['weather_condition']);
          }}
          className={inputClass(errors.weather_condition?.message)}
        >
          <option value="">Auto-fetch</option>
          {WEATHER_CONDITIONS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || status === 'loading'}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === 'loading' ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" /><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
            {bundle.records.new.buttons.saving}
          </>
        ) : (
          <>
            {bundle.records.new.buttons.save}
            <ArrowRightIcon size={16} />
          </>
        )}
      </button>
      {(serverErrors.form || status === 'error') && <p className="text-center text-sm font-medium text-agro-forest">{serverErrors.form}</p>}
      {queuedMessage && <p className="text-center text-sm font-medium text-agro-forest">{queuedMessage}</p>}
    </form>
  );
}
