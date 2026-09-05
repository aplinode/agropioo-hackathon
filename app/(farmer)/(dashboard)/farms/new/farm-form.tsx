"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFarmSchema, type CreateFarmInput } from "@/lib/validation/farms";
import { PAKISTAN_DISTRICTS } from "@/lib/farms/districts";
import { CROPS, IRRIGATION_METHODS, SOIL_TYPES, type Crop, type IrrigationMethod, type SoilType } from "@/lib/farms/constants";
import { photonReverse, photonSearch } from "@/lib/maps/photon";
import { generateClientUuid, queueWrite } from "@/lib/offline/queue-helpers";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  MapPinIcon,
  XIcon,
} from "@/components/icons";
import Link from "next/link";
import type { FarmsBundle } from "../farms-bundle";

const FarmMap = dynamic(() => import("./farm-map").then((m) => m.FarmMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-agro-sprout bg-agro-mint/30">
      <p className="text-sm text-agro-slate">Loading map...</p>
    </div>
  ),
});

function CropSearchSelect({
  selected,
  onToggle,
  error,
}: {
  selected: Crop[];
  onToggle: (crop: Crop) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = CROPS.filter(
    (c) =>
      c.toLowerCase().includes(query.toLowerCase()) &&
      !selected.includes(c)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-agro-ink mb-1">
        Crops
      </label>
      <div className="flex flex-wrap gap-2">
        {selected.map((crop) => (
          <span
            key={crop}
            className="inline-flex items-center gap-1.5 rounded-xl border border-agro-canopy bg-agro-mint px-3 py-1.5 text-sm capitalize text-agro-canopy"
          >
            {crop}
            <button
              type="button"
              onClick={() => onToggle(crop)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-agro-canopy hover:text-white"
            >
              <XIcon size={10} />
            </button>
          </span>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen(!open);
              setQuery("");
            }}
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-dashed border-agro-sprout px-3 text-sm text-agro-slate transition-colors hover:border-agro-canopy hover:text-agro-canopy"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Add crop
          </button>
          {open && (
            <div className="absolute start-0 z-[9999] mt-1 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-agro-sprout bg-white shadow-xl">
              <div className="p-1.5">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search crops..."
                  className="focus-ring-none h-8 w-full rounded-md border border-agro-sprout px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-agro-canopy/20"
                />
              </div>
              <div className="max-h-40 overflow-auto">
                {filtered.length > 0 ? (
                  filtered.map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      className="flex w-full items-center px-3 py-1.5 text-start text-xs capitalize text-agro-ink transition-colors hover:bg-agro-mint"
                      onClick={() => {
                        onToggle(crop);
                        setQuery("");
                      }}
                    >
                      {crop}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-agro-cloud">
                    No crops found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm font-medium text-agro-forest">{error}</p>
      )}
    </div>
  );
}

const DISTRICT_SUGGESTIONS: Record<string, string[]> = {
  Karachi: ["Clifton", "Gulshan-e-Iqbal", "Malir", "Korangi", "Orangi Town", "Saddar", "North Nazimabad", "Gadap Town"],
  Lahore: ["Gulberg", "Model Town", "DHA", "Johar Town", "Raiwind", "Thokar Niaz Baig", "Shahdara", "Barki"],
  Multan: ["Shah Rukn-e-Alam", "Bosan Road", "Shujabad", "Jalalpur Pirwala", "Suraj Miani", "Mati Tal"],
  Faisalabad: ["Lyallpur", "Samundri", "Jaranwala", "Tandlianwala", "Madina Town", "Dharampura"],
  Rawalpindi: ["Saddar", "Bahria Town", "Adyala Road", "Gujar Khan", "Taxila", "Kahuta"],
  Peshawar: ["Hayatabad", "University Town", "University Road", "Charsadda Road", "Bara Tehsil"],
  Quetta: ["Chaman Road", "Sariab Road", "Satellite Town", "Kuchlak", "Hazara Town"],
  Islamabad: ["F-6", "F-7", "G-11", "Tarlai", "Bhara Kahu", "Chak Shahzad", "Rawat"],
  Bahawalpur: ["Milad Chowk", "Model Town", "Bahawalpur Road", "Satellite Town", "Hasilpur Road", "Yazman Road", "Chishtian Road", "Ahmadpur East"],
};

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
  id,
}: {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-agro-ink">
        {placeholder}
      </label>
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={`focus-ring-none mt-2 flex h-12 w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 ${
            disabled
              ? "cursor-not-allowed border-agro-sprout/60 bg-agro-mint/20 text-agro-slate"
              : error
                ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
                : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
          }`}
        >
          <span className={selected ? "" : "text-agro-cloud"}>
            {selected ? selected.label : (placeholder || "Select...")}
          </span>
          <ChevronDownIcon
            size={16}
            className={`shrink-0 text-agro-slate transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 max-h-72 overflow-hidden rounded-xl border border-agro-sprout bg-white shadow-xl">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${placeholder}...`}
              className="focus-ring-none h-9 w-full rounded-lg border border-agro-sprout bg-agro-mint/30 px-3 text-sm text-agro-ink placeholder:text-agro-slate focus:outline-none focus:ring-2 focus:ring-agro-canopy/20"
            />
          </div>
          <div className="max-h-56 overflow-auto">
            {filtered.length > 0 ? (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`flex w-full items-center px-4 py-2.5 text-start text-sm transition-colors ${
                    o.value === value
                      ? "bg-agro-canopy/10 font-semibold text-agro-canopy"
                      : "text-agro-ink hover:bg-agro-mint"
                  }`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {o.value === value && (
                    <CheckIcon size={14} className="me-2 shrink-0 text-agro-canopy" />
                  )}
                  {o.label}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-agro-cloud">No options found</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm font-medium text-agro-forest">{error}</p>
      )}
    </div>
  );
}

const LocationSearch = forwardRef<{ skipAutoGeocode: () => void }, {
  value: string;
  district: string;
  onChange: (val: string) => void;
  onLocationPick: (lat: number, lng: number, displayName?: string) => void;
  error?: string;
  suggestions?: string[];
}>(function LocationSearch({
  value,
  district,
  onChange,
  onLocationPick,
  error,
  suggestions = [],
}, ref) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ display_name: string; lat: number; lon: number; address?: Record<string, string> }>
  >([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const skipAutoGeocodeRef = useRef(false);
  const justPickedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    skipAutoGeocode: () => {
      skipAutoGeocodeRef.current = true;
    },
  }));

  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveSuggestions = suggestions;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!district) {
      const timeout = window.setTimeout(() => {
        setResults([]);
        setOpen(false);
      }, 0);
      return () => clearTimeout(timeout);
    }
    if (query.length < 2) {
      const timeout = window.setTimeout(() => {
        setResults([]);
      }, 0);
      return () => clearTimeout(timeout);
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const searchQuery = `${query}, ${district}, Pakistan`;
        let filtered = await photonSearch(searchQuery, 6);

        if (filtered.length === 0) {
          filtered = await photonSearch(`${query}, Pakistan`, 12);
        }

        if (filtered.length === 0 && district) {
          filtered = await photonSearch(`${district}, Pakistan`, 6);
        }

        setResults(filtered);
        setOpen(filtered.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, district]);

  const locationPickRef = useRef(onLocationPick);
  useEffect(() => {
    locationPickRef.current = onLocationPick;
  });

  const autoGeocodeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (autoGeocodeRef.current) clearTimeout(autoGeocodeRef.current);
    if (query.length < 3 || open) return;
    if (skipAutoGeocodeRef.current) {
      skipAutoGeocodeRef.current = false;
      return;
    }

    autoGeocodeRef.current = window.setTimeout(async () => {
      try {
        const searchQuery = `${query}, ${district || "Pakistan"}`;
        const results = await photonSearch(searchQuery, 1);
        if (results[0]) {
          locationPickRef.current(
            results[0].lat,
            results[0].lon
          );
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    return () => {
      if (autoGeocodeRef.current) clearTimeout(autoGeocodeRef.current);
    };
  }, [query, district, open]);

  const handleSelect = (item: {
    display_name: string;
    lat: number;
    lon: number;
  }) => {
    skipAutoGeocodeRef.current = true;
    justPickedRef.current = true;
    const placeName = item.display_name;
    onChange(placeName);
    onLocationPick(item.lat, item.lon, placeName);
    setOpen(false);
    setQuery(placeName);
  };

  const handlePresetSelect = async (area: string) => {
    skipAutoGeocodeRef.current = true;
    justPickedRef.current = true;
    const fullLoc = `${area}, ${district}`;
    onChange(fullLoc);
    setQuery(fullLoc);
    setOpen(false);

    try {
      const results = await photonSearch(`${fullLoc}, Pakistan`, 1);
      if (results[0]) {
        onLocationPick(results[0].lat, results[0].lon);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="farm-location" className="block text-sm font-semibold text-agro-ink">
        Location / Village
      </label>
      <div className="relative">
        <input
          id="farm-location"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (district && suggestions.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={district ? `Type village or area in ${district}...` : "Select district or city first"}
          disabled={!district}
          className={`focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 pe-10 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
            !district
              ? "border-agro-sprout/60 bg-agro-mint/20 text-agro-slate cursor-not-allowed"
              : error
                ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
                : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
          }`}
        />
        {loading && district && (
          <div className="absolute end-3 top-1/2 mt-1">
            <svg
              className="h-4 w-4 animate-spin text-agro-slate"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.25"
              />
              <path
                fill="currentColor"
                opacity="0.75"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}
      </div>

      {!district && (
        <p className="mt-1.5 text-xs font-medium text-agro-slate">
          Please select a district or city above first
        </p>
      )}

      {district && open && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 max-h-64 overflow-auto rounded-xl border border-agro-sprout bg-white shadow-xl">
          {results.length > 0 ? (
            results.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="flex w-full items-start px-4 py-3 text-start text-sm text-agro-ink transition-colors hover:bg-agro-mint"
                onClick={() => handleSelect(item)}
              >
                <MapPinIcon
                  size={16}
                  className="mt-0.5 me-2 shrink-0 text-agro-canopy"
                />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))
          ) : query.length < 2 && effectiveSuggestions.length > 0 ? (
            <div className="p-3">
              <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wider text-agro-slate">
                Popular areas in {district}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {effectiveSuggestions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className="rounded-lg border border-agro-sprout bg-agro-mint/50 px-3 py-1.5 text-xs font-medium text-agro-canopy transition-colors hover:bg-agro-canopy hover:text-white"
                    onClick={() => handlePresetSelect(area)}
                  >
                    + {area}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm font-medium text-agro-forest">{error}</p>
      )}
    </div>
  );
});

function DistrictSelect({
  value,
  onChange,
  onLocationPick,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  onLocationPick: (lat: number, lng: number) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = PAKISTAN_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = async (district: string) => {
    onChange(district);
    setOpen(false);
    setQuery("");
    if (!district) return;

    setLoading(true);
    try {
      const results = await photonSearch(`${district}, Pakistan`, 1);
      if (results[0]) {
        onLocationPick(results[0].lat, results[0].lon);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="relative z-[10000]">
      <label htmlFor="farm-district" className="block text-sm font-semibold text-agro-ink">
        District / City
      </label>
      <div className="relative">
        <button
          type="button"
          id="farm-district"
          onClick={() => setOpen(!open)}
          className={`focus-ring-none mt-2 flex h-12 w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm text-agro-ink transition-colors duration-200 focus:outline-none focus:ring-2 ${
            error
              ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
              : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
          }`}
        >
          <span className={value ? "" : "text-agro-cloud"}>
            {value || "Select district or city..."}
          </span>
          <ChevronDownIcon
            size={16}
            className={`shrink-0 text-agro-slate transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {loading && (
          <div className="absolute end-3 top-1/2 mt-1">
            <svg
              className="h-4 w-4 animate-spin text-agro-slate"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.25"
              />
              <path
                fill="currentColor"
                opacity="0.75"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </div>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 max-h-72 overflow-hidden rounded-xl border border-agro-sprout bg-white shadow-xl">
          <div className="p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search district..."
              className="focus-ring-none h-9 w-full rounded-lg border border-agro-sprout bg-agro-mint/30 px-3 text-sm text-agro-ink placeholder:text-agro-slate focus:outline-none focus:ring-2 focus:ring-agro-canopy/20"
            />
          </div>
          <div className="max-h-56 overflow-auto">
            {filtered.length > 0 ? (
              filtered.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`flex w-full items-center px-4 py-2.5 text-start text-sm transition-colors ${
                    d === value
                      ? "bg-agro-canopy/10 font-semibold text-agro-canopy"
                      : "text-agro-ink hover:bg-agro-mint"
                  }`}
                  onClick={() => handleSelect(d)}
                >
                  {d === value && (
                    <CheckIcon size={14} className="me-2 shrink-0 text-agro-canopy" />
                  )}
                  {d}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-agro-cloud">No districts found</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm font-medium text-agro-forest">{error}</p>
      )}
    </div>
  );
}

export default function NewFarmForm({ bundle }: { bundle: FarmsBundle }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "saved" | "error"
  >("idle");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>(
    {}
  );
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number }>({
    lat: 30.3753,
    lng: 69.3451,
  });
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([]);
  const locationSearchRef = useRef<{ skipAutoGeocode: () => void }>(null);
  const clientUuidRef = useRef(generateClientUuid());

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
      name: "",
      location: "",
      district: "",
      crops: [],
      acres: 1,
      lat: 30.3753,
      lng: 69.3451,
    },
  });

  const selectedDistrict = watch("district");
  const selectedCrops = watch("crops") || [];
  const [primaryCrop, setPrimaryCrop] = useState<string>(selectedCrops[0] ?? CROPS[0]);
  const [sowing, setSowing] = useState("");
  const [soil, setSoil] = useState<SoilType | "">("");
  const [irrigation, setIrrigation] = useState<IrrigationMethod>("drip");

  const handlePickLocation = async (lat: number, lng: number, displayName?: string) => {
    setMarker({ lat, lng });
    setValue("lat", lat);
    setValue("lng", lng);
    locationSearchRef.current?.skipAutoGeocode();

    setIsGeocoding(true);
    try {
      if (displayName) {
        setSelectedLocationName(displayName);
      } else {
        const result = await photonReverse(lat, lng);
        if (result) {
          const addr = result.address || {};
          const placeName =
            addr.village ||
            addr.suburb ||
            addr.town ||
            addr.neighbourhood ||
            addr.city_district ||
            addr.city ||
            addr.county ||
            result.display_name ||
            "Selected Location";

          const fullName = result.display_name || placeName;
          setSelectedLocationName(fullName);
          setValue("location", placeName);
        }
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (!selectedDistrict) {
      setDistrictSuggestions([]);
      return;
    }
    let cancelled = false;
    async function fetchSuggestions() {
      try {
        const data = await photonSearch(`${selectedDistrict}, Pakistan`, 20);
        if (!cancelled) {
          const areas = new Set<string>();
          data.forEach((item) => {
            const addr = item.address || {};
            const candidates = [
              addr.suburb, addr.neighbourhood, addr.town, addr.village,
              addr.city_district, addr.county, addr.street,
            ].filter(Boolean);
            candidates.forEach((c) => {
              const name = c.split(",")[0].trim();
              if (name && name.toLowerCase() !== selectedDistrict.toLowerCase()) {
                areas.add(name);
              }
            });
          });
          if (areas.size > 0) {
            setDistrictSuggestions(Array.from(areas).slice(0, 8));
          } else {
            setDistrictSuggestions(DISTRICT_SUGGESTIONS[selectedDistrict] || []);
          }
        }
      } catch {
        if (!cancelled) setDistrictSuggestions(DISTRICT_SUGGESTIONS[selectedDistrict] || []);
      }
    }
    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [selectedDistrict]);

  useEffect(() => {
    setValue("location", "");
    setSelectedLocationName("");
  }, [selectedDistrict, setValue]);

  const onSubmit = async (data: CreateFarmInput) => {
    setStatus("loading");
    setServerErrors({});
    setQueuedMessage(null);
    try {
      const res = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          primary_crop: primaryCrop,
          sowing_date: sowing || null,
          soil_type: soil || null,
          irrigation_method: irrigation,
          client_uuid: clientUuidRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        if (body.error?.issues) {
          const map: Record<string, string> = {};
          body.error.issues.forEach((i: Record<string, unknown>) => {
            map[(i.path as unknown as string[]).join(".")] =
              i.message as string;
          });
          setServerErrors(map);
        } else {
          setServerErrors({ form: body.error?.message || "Failed to save" });
        }
        setStatus("error");
        return;
      }
      const farm = await res.json();
      setStatus("saved");
      setTimeout(() => router.push(`/farms/${farm.id}`), 600);
    } catch {
      await queueWrite({
        url: "/api/farms",
        method: "POST",
        body: JSON.stringify({
          ...data,
          primary_crop: primaryCrop,
          sowing_date: sowing || null,
          soil_type: soil || null,
          irrigation_method: irrigation,
          client_uuid: clientUuidRef.current,
        }),
      });
      setQueuedMessage("Saved offline — will sync when you are back online.");
      setStatus("saved");
    }
  };

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
          Farm saved
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-agro-slate">
          {bundle.new.success.description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/farms")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0"
          >
            {bundle.new.success.goToFarms}
            <ArrowRightIcon size={16} />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-agro-canopy/30 bg-white px-5 text-sm font-semibold text-agro-forest transition-colors duration-200 hover:border-agro-canopy hover:bg-agro-mint"
          >
            {bundle.new.success.backToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = (err?: string) =>
    `focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
      err
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} noValidate className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-agro-sprout bg-agro-mint/40 px-4 py-2.5">
        <p className="text-xs font-medium text-agro-ink">Complete all fields to save your farm</p>
        <div className="flex items-center gap-1.5">
          {[
            { key: "name", label: "Name", done: !!watch("name") },
            { key: "district", label: "District", done: !!selectedDistrict },
            { key: "location", label: "Location", done: !!watch("location") },
            { key: "crops", label: "Crops", done: selectedCrops.length > 0 },
          ].map((item) => (
            <span
              key={item.key}
              title={item.label}
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                item.done ? "bg-agro-canopy" : "bg-agro-sprout"
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="farm-name"
          className="block text-sm font-semibold text-agro-ink"
        >
          {bundle.new.fields.name}
        </label>
        <input
          id="farm-name"
          {...register("name")}
          className={inputClass(errors.name?.message)}
        />
        {(errors.name || serverErrors.name) && (
          <p className="mt-1.5 text-sm font-medium text-agro-forest">
            {errors.name?.message || serverErrors.name}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <DistrictSelect
          value={selectedDistrict}
          onChange={(val) => setValue("district", val)}
          onLocationPick={(lat, lng) => {
            setMarker({ lat, lng });
            setValue("lat", lat);
            setValue("lng", lng);
          }}
          error={errors.district?.message || serverErrors.district}
        />
        <div>
          <label
            htmlFor="farm-acres"
            className="block text-sm font-semibold text-agro-ink"
          >
            {bundle.new.fields.acres}
          </label>
          <input
            id="farm-acres"
            type="number"
            step="0.5"
            {...register("acres", { valueAsNumber: true })}
            className={inputClass(errors.acres?.message)}
          />
          {(errors.acres || serverErrors.acres) && (
            <p className="mt-1.5 text-sm font-medium text-agro-forest">
              {errors.acres?.message || serverErrors.acres}
            </p>
          )}
        </div>
      </div>

      <LocationSearch
        ref={locationSearchRef}
        value={watch("location")}
        district={selectedDistrict}
        onChange={(val) => setValue("location", val)}
        onLocationPick={(lat, lng, displayName) => handlePickLocation(lat, lng, displayName)}
        error={errors.location?.message || serverErrors.location}
        suggestions={districtSuggestions}
      />

      <CropSearchSelect
        selected={selectedCrops}
        onToggle={(crop) => {
          const current = watch("crops") || [];
          if (current.includes(crop)) {
            setValue("crops", current.filter((c) => c !== crop));
          } else {
            setValue("crops", [...current, crop]);
          }
        }}
        error={errors.crops?.message || serverErrors.crops}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <CustomSelect
            id="farm-primary-crop"
            value={primaryCrop}
            onChange={(val) => setPrimaryCrop(val)}
            options={(selectedCrops.length ? selectedCrops : CROPS).map((c) => ({ value: c, label: c }))}
            placeholder={bundle.new.fields.primaryCrop}
            disabled={selectedCrops.length === 0}
          />
          {selectedCrops.length === 0 && (
            <p className="mt-1.5 text-xs text-agro-slate">Add at least one crop first</p>
          )}
        </div>

        <div>
          <CustomSelect
            id="farm-soil"
            value={soil}
            onChange={(val) => setSoil(val as SoilType)}
            options={SOIL_TYPES.map((s) => ({ value: s, label: s }))}
            placeholder={bundle.new.fields.soilType}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="farm-sowing"
            className="block text-sm font-semibold text-agro-ink"
          >
            {bundle.new.fields.sowingDate}
          </label>
          <input
            id="farm-sowing"
            type="date"
            value={sowing}
            onChange={(e) => setSowing(e.target.value)}
            className="mt-2 w-full rounded-xl border border-agro-sprout bg-white px-3 py-2.5 text-sm text-agro-ink outline-none focus:border-agro-canopy focus:ring-2 focus:ring-agro-canopy/20"
          />
        </div>

        <div>
          <CustomSelect
            id="farm-irrigation"
            value={irrigation}
            onChange={(val) => setIrrigation(val as IrrigationMethod)}
            options={IRRIGATION_METHODS.map((m) => ({ value: m, label: m }))}
            placeholder={bundle.new.fields.irrigationMethod}
          />
        </div>
      </div>

      <FarmMap marker={marker} onPickLocation={handlePickLocation} />

        {isGeocoding ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-agro-slate animate-pulse">
            <MapPinIcon size={14} className="text-agro-canopy" />
            Finding address for selected location...
          </p>
        ) : selectedLocationName ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-agro-mint px-3.5 py-2.5 text-xs font-medium text-agro-canopy border border-agro-sprout">
            <MapPinIcon size={16} className="shrink-0 text-agro-canopy" />
            <span className="line-clamp-2">
              <strong>Selected Location:</strong> {selectedLocationName}
            </span>
          </div>
        ) : null}

      <button
        type="submit"
        disabled={isSubmitting || status === "loading"}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {status === "loading" ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                opacity="0.25"
              />
              <path
                fill="currentColor"
                opacity="0.75"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
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
      {(serverErrors.form || status === "error") && (
        <p className="text-center text-sm font-medium text-agro-forest">
          {serverErrors.form}
        </p>
      )}
      {queuedMessage && (
        <p className="text-center text-sm font-medium text-agro-forest">
          {queuedMessage}
        </p>
      )}
    </form>
  );
}
