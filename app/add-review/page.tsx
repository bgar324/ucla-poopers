"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/supabaseClient";

export default function AddReviewPage() {
  const router = useRouter();
  //user
  const [userId, setUserId] = useState<string | null>(null);

  //bathroom
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState<number | "">("");
  const [type, setType] = useState("");
  const bathroomTypes = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "gender-neutral", label: "Gender Neutral" },
  { value: "accessible", label: "Accessible" },
];

  //review
  const [rating, setRating] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // temporary geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.replace("/"); // redirect to login/home
        return;
      }

      setUserId(session.user.id);
    };

    void fetchUser();
  }, [router]);

  //use user location for now
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (err) => {
        console.warn("Geolocation failed, defaulting to 0,0", err);
        setLatitude(0);
        setLongitude(0);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
    }, []);

  const handleSubmit = async () => {
    if (
      !userId ||
      !name ||
      !building ||
      !floor ||
      !type ||
      !rating ||
      latitude === null ||
      longitude === null
    ) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bathroom: { name, building, floor, latitude, longitude, type },
          review: { rating, description },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add review.");
      }

      router.push("/dashboard"); // go back to dashboard after success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-amber-900">Add Bathroom & Review</h1>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        {/* Bathroom fields */}
        <input
          className="mb-2 w-full border px-3 py-2"
          placeholder="Bathroom Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="mb-2 w-full border px-3 py-2"
          placeholder="Building"
          value={building}
          onChange={(e) => setBuilding(e.target.value)}
        />
        <input
          className="mb-2 w-full border px-3 py-2"
          placeholder="Floor"
          type="number"
          value={floor}
          onChange={(e) => setFloor(Number(e.target.value))}
        />

        <div className="mb-2 w-full">
          <label className="block mb-1 text-sm font-medium text-gray-700">Bathroom Type</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="" disabled>Select type...</option>
            {bathroomTypes.map((bt) => (
              <option key={bt.value} value={bt.value}>
                {bt.label}
              </option>
            ))}
          </select>
        </div>
        {/* Review fields */}
        <input
          className="mb-2 w-full border px-3 py-2"
          placeholder="Rating (1-5)"
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
        <textarea
          className="mb-2 w-full border px-3 py-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          className="w-full bg-amber-900 text-white py-2 rounded font-semibold mt-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Review"}
        </button>
      </div>
    </main>
  );
}