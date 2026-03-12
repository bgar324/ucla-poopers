"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import supabase from "@/supabaseClient";
import { ChevronDown, Plus } from "lucide-react";
import ToiletBG from "../components/ToiletBG";

interface BathroomOption {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: string;
  typeLabel?: string;
  latitude: number;
  longitude: number;
}

const BATHROOM_TYPES = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "gender-neutral", label: "Gender Neutral" },
  { value: "accessible", label: "Accessible" },
];

function formatBathroomType(type: string) {
  const t = BATHROOM_TYPES.find((x) => x.value === type);
  return t?.label ?? type;
}

const BathroomLocationPicker = dynamic(
  () => import("../components/BathroomLocationPicker").then((mod) => mod.default),
  { ssr: false }
);

export default function AddReviewPage() {
  const router = useRouter();
  const [supabaseAuthId, setSupabaseAuthId] = useState<string | null>(null);
  const [requestedBathroomId, setRequestedBathroomId] = useState<string | null>(
    null
  );

  const [bathrooms, setBathrooms] = useState<BathroomOption[]>([]);
  const [bathroomSearch, setBathroomSearch] = useState("");
  const [selectedBathroomId, setSelectedBathroomId] = useState<string | null>(null);
  const [addNewBathroom, setAddNewBathroom] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState<number | "">("");
  const [type, setType] = useState("");

  const [rating, setRating] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingBathrooms, setLoadingBathrooms] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace("/");
        return;
      }
      setSupabaseAuthId(session.user.id);
    };
    void fetchUser();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setRequestedBathroomId(params.get("bathroomId"));
  }, []);

  useEffect(() => {
    if (!supabaseAuthId) {
      return;
    }

    const load = async () => {
      setLoadingBathrooms(true);
      try {
        const params = new URLSearchParams({ supabaseAuthId });
        const res = await fetch(`/api/bathrooms?${params.toString()}`);
        const data = (await res.json()) as { bathrooms?: BathroomOption[]; error?: string };
        if (res.ok && data.bathrooms) {
          setBathrooms(data.bathrooms);
        }
      } finally {
        setLoadingBathrooms(false);
      }
    };
    void load();
  }, [supabaseAuthId]);

  useEffect(() => {
    if (!requestedBathroomId || bathrooms.length === 0) {
      return;
    }

    const requestedBathroom = bathrooms.find(
      (bathroom) => bathroom.id === requestedBathroomId
    );

    if (!requestedBathroom) {
      return;
    }

    setSelectedBathroomId(requestedBathroom.id);
    setBathroomSearch(
      `${requestedBathroom.name} – ${requestedBathroom.building}, Floor ${requestedBathroom.floor}`
    );
    setAddNewBathroom(false);
  }, [bathrooms, requestedBathroomId]);

  const searchLower = bathroomSearch.trim().toLowerCase();
  const filteredBathrooms = useMemo(() => {
    if (!searchLower) return bathrooms;
    return bathrooms.filter(
      (b) =>
        b.name.toLowerCase().includes(searchLower) ||
        b.building.toLowerCase().includes(searchLower) ||
        (b.typeLabel ?? formatBathroomType(b.type)).toLowerCase().includes(searchLower)
    );
  }, [bathrooms, searchLower]);

  const selectedBathroom = selectedBathroomId
    ? bathrooms.find((b) => b.id === selectedBathroomId)
    : null;

  const showAddNewOption =
    addNewBathroom ||
    (searchLower.length > 0 && filteredBathrooms.length === 0) ||
    (searchLower.length > 0 && !bathrooms.some((b) => b.name.toLowerCase() === searchLower));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationChange = (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationConfirmed(false);
    setError("");
  };

  const handleSelectBathroom = (b: BathroomOption) => {
    setSelectedBathroomId(b.id);
    setBathroomSearch(`${b.name} – ${b.building}, Floor ${b.floor}`);
    setAddNewBathroom(false);
    setLatitude(null);
    setLongitude(null);
    setLocationConfirmed(false);
    setDropdownOpen(false);
    setError("");
  };

  const handleAddNewBathroom = () => {
    setAddNewBathroom(true);
    if (bathroomSearch.trim()) setName(bathroomSearch.trim());
    setSelectedBathroomId(null);
    setLatitude(null);
    setLongitude(null);
    setLocationConfirmed(false);
    setDropdownOpen(false);
    setError("");
  };

  const handleCancelNewBathroom = () => {
    setAddNewBathroom(false);
    setBathroomSearch("");
    setName("");
    setBuilding("");
    setFloor("");
    setType("");
    setLatitude(null);
    setLongitude(null);
    setLocationConfirmed(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!supabaseAuthId || !rating) {
      setError("Rating is required.");
      return;
    }

    if (!addNewBathroom && !selectedBathroomId) {
      setError("Select a bathroom or choose to add a new one.");
      return;
    }

    if (addNewBathroom) {
      if (!name || !building || floor === "" || !type || latitude === null || longitude === null) {
        setError("New bathroom: name, building, floor, and type are required.");
        return;
      }

      if (!locationConfirmed) {
        setError("Confirm the restroom pin on the map before submitting.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const payload: {
        supabaseAuthId: string;
        bathroomId?: string;
        bathroom?: {
          name: string;
          building: string;
          floor: number;
          latitude: number;
          longitude: number;
          type: string;
        };
        review: { rating: number; description: string };
      } = {
        supabaseAuthId,
        review: { rating: Number(rating), description: description.trim() },
      };

      if (addNewBathroom) {
        payload.bathroom = {
          name,
          building,
          floor: Number(floor),
          latitude: latitude ?? 0,
          longitude: longitude ?? 0,
          type,
        };
      } else {
        payload.bathroomId = selectedBathroomId!;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to add review.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <ToiletBG />
      <div className="w-full max-w-2xl z-10 rounded-xl border border-amber-900/10 bg-rose-100/95 p-8 shadow-[0_28px_90px_rgba(120,53,15,0.12)] lg:p-10">
        <h1 className="font-gasoek text-4xl mb-4 text-amber-900">Add Bathroom</h1>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        {/* Bathroom selector */}
        <div className="relative mb-4" ref={dropdownRef}>
          <label className="block mb-1 text-sm font-medium text-slate-600">Bathroom</label>
          <div className="relative">
            <input
              type="text"
              className="w-full border border-amber-900 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-900"
              placeholder="Search or select a bathroom..."
              value={addNewBathroom ? name : bathroomSearch}
              onChange={(e) => {
                const v = e.target.value;
                if (addNewBathroom) {
                  setName(v);
                } else {
                  setBathroomSearch(v);
                  setSelectedBathroomId(null);
                  setDropdownOpen(true);
                }
              }}
              onFocus={() => setDropdownOpen(true)}
            />
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {dropdownOpen && !addNewBathroom && (
            <div className="absolute z-10 mt-1 w-full max-w-lg rounded-lg border border-amber-200 bg-white shadow-lg max-h-60 overflow-auto">
              {loadingBathrooms ? (
                <div className="p-3 text-gray-500 text-sm">Loading bathrooms...</div>
              ) : (
                <>
                  {filteredBathrooms.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 flex flex-col"
                      onClick={() => handleSelectBathroom(b)}
                    >
                      <span className="font-medium text-amber-900">{b.name}</span>
                      <span className="text-sm text-gray-600">
                        {b.building} • Floor {b.floor} • {b.typeLabel ?? formatBathroomType(b.type)}
                      </span>
                    </button>
                  ))}
                  {showAddNewOption && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2 text-amber-900 font-medium border-t border-amber-100"
                      onClick={handleAddNewBathroom}
                    >
                      <Plus size={16} />
                      {searchLower
                        ? `Add new bathroom "${bathroomSearch.trim()}"`
                        : "Add a new bathroom"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {selectedBathroom && !addNewBathroom && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: {selectedBathroom.name} ({selectedBathroom.building})
            </p>
          )}
        </div>

        {/* New bathroom form (when "add new" is chosen) */}
        {addNewBathroom && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">New bathroom details</p>
            <p className="mt-1 text-sm text-amber-800/80">
              The map starts from your current location. Drag the pin until it sits exactly where the restroom entrance should be, then confirm it.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Bathroom name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Building"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Floor"
                type="number"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value) || "")}
              />
              <div>
                <label className="mb-1 block text-sm text-gray-700">Type</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="">Select type...</option>
                  {BATHROOM_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <BathroomLocationPicker
                latitude={latitude}
                longitude={longitude}
                isConfirmed={locationConfirmed}
                onLocationChange={handleLocationChange}
                onConfirm={() => {
                  setLocationConfirmed(true);
                  setError("");
                }}
              />
            </div>

            <button
              type="button"
              className="mt-4 text-sm text-amber-800 underline"
              onClick={handleCancelNewBathroom}
            >
              Cancel – choose existing bathroom
            </button>
          </div>
        )}

        {/* Review fields */}
        <div className="mb-2">
          <label className="block mb-1 text-sm font-medium text-slate-600">Rating (1–5)</label>
          <input
            className="w-full border border-amber-900 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value) || "")}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-slate-600">Review (optional)</label>
          <textarea
            className="w-full border border-amber-900 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
            placeholder="Your experience..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-amber-900 text-white py-2 rounded-lg font-semibold hover:cursor-pointer hover:bg-amber-800"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Review"}
        </button>

        <button
          type="button"
          className="w-full mt-2 text-amber-900 font-medium hover:cursor-pointer hover:text-amber-800"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}
