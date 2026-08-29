"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFarmSchema, type CreateFarmInput } from "@/lib/validation/farms";
import { PAKISTAN_DISTRICTS } from "@/lib/farms/districts";
import { CROPS, type Crop } from "@/lib/farms/constants";
import {
  ArrowRightIcon,
  CheckIcon,
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
            <div className="absolute left-0 z-[9999] mt-1 w-64 overflow-auto rounded-xl border border-agro-sprout bg-white shadow-xl">
              <div className="p-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search crops..."
                  className="focus-ring-none h-9 w-full rounded-lg border border-agro-sprout px-3 text-sm focus:outline-none focus:ring-2 focus:ring-agro-canopy/20"
                />
              </div>
              {filtered.length > 0 ? (
                filtered.map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    className="flex w-full items-center px-4 py-2.5 text-left text-sm capitalize text-agro-ink transition-colors hover:bg-agro-mint"
                    onClick={() => {
                      onToggle(crop);
                      setQuery("");
                    }}
                  >
                    {crop}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-agro-cloud">
                  No crops found
                </p>
              )}
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
};

const MAJOR_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta",
  "Hyderabad", "Sukkur", "Larkana", "Gujranwala", "Sialkot", "Bahawalpur", "Sargodha", "Dera Ghazi Khan"
];

function getCityDisplayName(item: { address?: Record<string, string>; display_name: string }): string {
  const addr = item.address || {};
  return (
    addr.city_district ||
    addr.city ||
    addr.town ||
    addr.county ||
    addr.village ||
    item.display_name.split(",")[0]
  );
}

function LocationSearch({
  value,
  district,
  onChange,
  onLocationPick,
  error,
}: {
  value: string;
  district: string;
  onChange: (val: string) => void;
  onLocationPick: (lat: number, lng: number) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = DISTRICT_SUGGESTIONS[district] || [];

  const isWithinDistrict = (addr: Record<string, string>, district: string): boolean => {
    if (!district) return true;
    const lower = district.toLowerCase();
    const candidates = [
      addr.city_district,
      addr.state_district,
      addr.county,
      addr.city,
      addr.town,
      addr.village,
      addr.suburb,
      addr.neighbourhood,
    ].filter(Boolean);
    return candidates.some((c) => c!.toLowerCase() === lower);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const searchQuery = `${query}, ${district || ""}, Pakistan`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pk&limit=6&addressdetails=1`
        );
        let data = await res.json() as Array<{
          display_name: string;
          lat: string;
          lon: string;
          address?: Record<string, string>;
        }>;

        if (data.length === 0 && district) {
          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Pakistan")}&countrycodes=pk&limit=6&addressdetails=1`
          );
          data = await fallbackRes.json() as Array<{
            display_name: string;
            lat: string;
            lon: string;
            address?: Record<string, string>;
          }>;
        }

        const filtered = district
          ? data.filter((item) => isWithinDistrict(item.address || {}, district))
          : data;

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

    autoGeocodeRef.current = window.setTimeout(async () => {
      try {
        const searchQuery = `${query}, ${district || "Pakistan"}`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pk&limit=1&addressdetails=1`
        );
        const data = await res.json();
        if (data && data[0]) {
          locationPickRef.current(
            parseFloat(data[0].lat),
            parseFloat(data[0].lon)
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
    lat: string;
    lon: string;
  }) => {
    const placeName = item.display_name.split(",")[0];
    onChange(placeName);
    onLocationPick(parseFloat(item.lat), parseFloat(item.lon));
    setOpen(false);
    setQuery(placeName);
  };

  const handlePresetSelect = async (area: string) => {
    const fullLoc = `${area}, ${district}`;
    onChange(fullLoc);
    setQuery(fullLoc);
    setOpen(false);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullLoc + ", Pakistan")}&countrycodes=pk&limit=1`
      );
      const data = await res.json();
      if (data && data[0]) {
        onLocationPick(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div ref={ref} className="relative">
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
          placeholder={`Type village or area in ${district || "your district"}...`}
          className={`focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 pr-10 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
            error
              ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
              : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
          }`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 mt-1">
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
        <div className="absolute left-0 right-0 z-[9999] mt-1 max-h-64 overflow-auto rounded-xl border border-agro-sprout bg-white shadow-xl">
          {results.length > 0 ? (
            results.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="flex w-full items-start px-4 py-3 text-left text-sm text-agro-ink transition-colors hover:bg-agro-mint"
                onClick={() => handleSelect(item)}
              >
                <MapPinIcon
                  size={16}
                  className="mt-0.5 mr-2 shrink-0 text-agro-canopy"
                />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))
          ) : query.length < 2 && suggestions.length > 0 ? (
            <div className="p-3">
              <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wider text-agro-slate">
                Popular areas in {district}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {suggestions.map((area) => (
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
}

function DistrictCitySearch({
  value,
  onChange,
  onLocationPick,
  onPlaceSelect,
  onDisplayName,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  onLocationPick: (lat: number, lng: number) => void;
  onPlaceSelect?: (placeName: string) => void;
  onDisplayName?: (name: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ display_name: string; lat: string; lon: string; address?: Record<string, string> }>
  >([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Pakistan")}&countrycodes=pk&limit=8&addressdetails=1`
        );
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const extractDistrict = (
    addr: Record<string, string>,
    displayName: string
  ): string => {
    const candidates = [
      addr.city_district,
      addr.state_district,
      addr.county,
      addr.city,
      addr.town,
      addr.village,
      addr.suburb,
      addr.neighbourhood,
    ].filter(Boolean);

    const matchedDistrict = PAKISTAN_DISTRICTS.find((d) =>
      candidates.some((c) => c!.toLowerCase() === d.toLowerCase())
    );

    if (matchedDistrict) return matchedDistrict;

    const fullLower = displayName.toLowerCase();
    for (const d of PAKISTAN_DISTRICTS) {
      if (fullLower.includes(d.toLowerCase())) return d;
    }

    return candidates[0] || displayName.split(",")[0];
  };

  const handleSelect = (item: {
    display_name: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
  }) => {
    const district = extractDistrict(item.address || {}, item.display_name);
    const placeName = getCityDisplayName(item);
    onChange(district);
    if (onPlaceSelect) onPlaceSelect(placeName);
    onLocationPick(parseFloat(item.lat), parseFloat(item.lon));
    if (onDisplayName) onDisplayName(item.display_name);
    setOpen(false);
    setQuery(district);
  };

  const handleMajorCitySelect = async (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ", Pakistan")}&countrycodes=pk&limit=1&addressdetails=1`
      );
      const data = await res.json();
      if (data && data[0]) {
        onLocationPick(parseFloat(data[0].lat), parseFloat(data[0].lon));
        if (onDisplayName) onDisplayName(data[0].display_name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div ref={ref} className="relative z-[10000]">
      <label className="block text-sm font-semibold text-agro-ink">
        District / City
      </label>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search district or city..."
          className={`focus-ring-none mt-2 h-12 w-full rounded-xl border bg-white px-4 pr-10 text-sm text-agro-ink transition-colors duration-200 placeholder:text-agro-cloud focus:outline-none focus:ring-2 ${
            error
              ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
              : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
          }`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 mt-1">
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
      {query.length < 2 && (
        <div className="mt-2">
          <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wider text-agro-slate">
            Major Cities
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {MAJOR_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                className="rounded-lg border border-agro-sprout bg-agro-mint/50 px-3 py-1.5 text-xs font-medium text-agro-canopy transition-colors hover:bg-agro-canopy hover:text-white"
                onClick={() => handleMajorCitySelect(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 z-[9999] mt-1 max-h-60 overflow-auto rounded-xl border border-agro-sprout bg-white shadow-xl">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="flex w-full items-start px-4 py-3 text-left text-sm text-agro-ink transition-colors hover:bg-agro-mint"
              onClick={() => handleSelect(item)}
            >
              <MapPinIcon
                size={16}
                className="mt-0.5 mr-2 shrink-0 text-agro-canopy"
              />
              <span className="line-clamp-2">{getCityDisplayName(item)}</span>
            </button>
          ))}
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
  const [marker, setMarker] = useState<{ lat: number; lng: number }>({
    lat: 30.3753,
    lng: 69.3451,
  });
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

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
      district: PAKISTAN_DISTRICTS[0],
      crops: [],
      acres: 1,
      lat: 30.3753,
      lng: 69.3451,
    },
  });

  const selectedDistrict = watch("district");
  const selectedCrops = watch("crops") || [];

  const handlePickLocation = async (lat: number, lng: number) => {
    setMarker({ lat, lng });
    setValue("lat", lat);
    setValue("lng", lng);

    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const placeName =
          addr.village ||
          addr.suburb ||
          addr.town ||
          addr.neighbourhood ||
          addr.city_district ||
          addr.city ||
          addr.county ||
          data.display_name?.split(",")[0] ||
          "Selected Location";

        const fullName = data.display_name || placeName;
        setSelectedLocationName(fullName);
        setValue("location", placeName);

        const districtCandidates = [
          addr.city_district,
          addr.state_district,
          addr.county,
          addr.city,
          addr.town,
          addr.village,
        ].filter(Boolean);

        let district = districtCandidates[0] || placeName;
        const matchedDistrict = PAKISTAN_DISTRICTS.find((d) =>
          districtCandidates.some((c) => c!.toLowerCase() === d.toLowerCase())
        );

        if (matchedDistrict) {
          district = matchedDistrict;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue("district", district as any);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const onSubmit = async (data: CreateFarmInput) => {
    setStatus("loading");
    setServerErrors({});
    try {
      const res = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      setServerErrors({ form: "Network error" });
      setStatus("error");
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
      err
        ? "border-agro-forest focus:border-agro-forest focus:ring-agro-forest/20"
        : "border-agro-sprout focus:border-agro-canopy focus:ring-agro-canopy/20"
    }`;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} noValidate className="space-y-5">
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
        <DistrictCitySearch
          value={selectedDistrict}
          onChange={(val) => setValue("district", val)}
          onLocationPick={(lat, lng) => {
            setMarker({ lat, lng });
            setValue("lat", lat);
            setValue("lng", lng);
          }}
          onPlaceSelect={(placeName) => setValue("location", placeName)}
          onDisplayName={(name) => setSelectedLocationName(name)}
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
        value={watch("location")}
        district={selectedDistrict}
        onChange={(val) => setValue("location", val)}
        onLocationPick={(lat, lng) => handlePickLocation(lat, lng)}
        error={errors.location?.message || serverErrors.location}
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
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-agro-canopy text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-agro-forest hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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
    </form>
  );
}
