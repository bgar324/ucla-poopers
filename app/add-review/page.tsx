"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/supabaseClient";
import { ChevronDown, Plus } from "lucide-react";
import ToiletBG from "../components/ToiletBG";
import Rating from "../components/Rating";


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

    <div className="w-full max-w-2xl z-10 rounded-xl border border-amber-900/10 bg-rose-100/95 p-10 shadow-[0_28px_90px_rgba(120,53,15,0.12)]">

      {/* HEADER */}
      <h1 className="font-gasoek text-4xl text-amber-900">Add Review</h1>
      <p className="font-rubik text-sm text-amber-800/70 mt-1">
        Leave a review for a bathroom you've visited.
      </p>

      {error && (
        <p className="text-red-600 mt-3 font-rubik text-sm">{error}</p>
      )}

      {/* BATHROOM SELECTOR */}
      <div className="mt-6" ref={dropdownRef}>
        <label className="block mb-2 text-sm font-rubik font-medium text-amber-900">
          Bathroom
        </label>

        <div className="relative">
          <input
            type="text"
            className="w-full rounded-lg border border-amber-900 px-3 py-2 pr-10 font-rubik focus:outline-none focus:ring-2 focus:ring-amber-900"
            placeholder="Search or select a bathroom..."
            value={bathroomSearch}
            onChange={(e) => {
              setBathroomSearch(e.target.value);
              setSelectedBathroomId(null);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
          />

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-900"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute z-10 mt-2 w-full max-w-lg rounded-lg border border-amber-200 bg-white shadow-lg max-h-60 overflow-auto">

            {loadingBathrooms ? (
              <div className="p-3 text-gray-500 text-sm font-rubik">
                Loading bathrooms...
              </div>
            ) : (
              filteredBathrooms.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-amber-50 flex flex-col transition"
                  onClick={() => handleSelectBathroom(b)}
                >
                  <span className="font-rubik font-medium text-amber-900">
                    {b.name}
                  </span>

                  <span className="text-sm font-rubik text-gray-600">
                    {b.building} • Floor {b.floor} • {b.typeLabel ?? formatBathroomType(b.type)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedBathroom && (
          <p className="mt-2 text-sm font-rubik text-gray-600">
            Selected:{" "}
            <span className="font-medium text-amber-900">
              {selectedBathroom.name}
            </span>{" "}
            ({selectedBathroom.building})
          </p>
        )}
      </div>
      
      <div className="mt-2">
                <Link 
                className ="hover:cursor-pointer font-rubik text-sm text-amber-800/70"
                href="/add-bathroom"
                > 
                Don't see the bathroom you're looking for?  {" "} 
                  <span className = "underline hover:text-amber-900"> Click here. </span>
                </Link>
        </div>
       

      {/* DIVIDER */}
      <div className="my-2 border-t border-amber-900/10" />

      {/* RATING */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-rubik font-medium text-amber-900">
          Rating
        </label>

        <Rating
          value={rating}
          interactive
          onChange={(val) => setRating(val)}
        />
      </div>

      {/* REVIEW TEXT */}
      <div>
        <label className="block mb-1 text-sm font-rubik font-medium text-amber-900">
          Review (optional)
        </label>

        <textarea
          maxLength={200}
          rows={3}
          className="w-full rounded-lg border border-amber-900 px-3 py-2 font-rubik focus:outline-none focus:ring-2 focus:ring-amber-900"
          placeholder="How was the bathroom?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <p
          className={`text-xs text-right mt-1 font-rubik ${
            description.length > 180
              ? "text-red-500"
              : "text-amber-800/70"
          }`}
        >
          {description.length}/200
        </p>
      </div>

      {/* SUBMIT */}
      <button
        className="w-full mt-6 bg-amber-900 text-white py-2.5 rounded-lg font-rubik font-semibold transition hover:bg-amber-800 active:scale-[0.98] hover:cursor-pointer"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Add Review"}
      </button>

      {/* BACK */}
      <button
        type="button"
        className="w-full mt-3 text-amber-900 font-rubik font-medium hover:text-amber-800 hover:cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        Back to Dashboard
      </button>

    </div>
  </main>
);
}