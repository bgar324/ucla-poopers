"use client";

import dynamic from "next/dynamic";
import Navbar from "@/app/components/Navbar";
import supabase from "@/supabaseClient";
import { Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import BathroomDetailPanel from "../components/BathroomDetailPanel";
import FilterDropdown, {
  type DashboardFilter,
} from "../components/FilterDropdown";
import SpotCard from "../components/SpotCard";
import ToiletBG from "../components/ToiletBG";
import Footer from "../components/Footer";

const BathroomMap = dynamic(
  () => import("../components/BathroomMap").then((mod) => mod.default),
  { ssr: false }
);

interface BathroomSpot {
  id: string;
  name: string;
  detail: string;
  building: string;
  floor: number;
  latitude: number;
  longitude: number;
  type: string;
  typeLabel: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
}

async function fetchBathroomSpots() {
  const response = await fetch("/api/bathrooms", { cache: "no-store" });
  const data = (await response.json().catch(() => null)) as
    | { bathrooms?: BathroomSpot[]; error?: string }
    | null;

  if (!response.ok || !data?.bathrooms) {
    throw new Error(data?.error ?? "Failed to load bathrooms.");
  }

  return data.bathrooms;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceInMiles(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
) {
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(end.latitude - start.latitude);
  const lonDelta = toRadians(end.longitude - start.longitude);
  const startLat = toRadians(start.latitude);
  const endLat = toRadians(end.latitude);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMiles * arc;
}

function matchesSearch(spot: BathroomSpot, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    spot.name,
    spot.detail,
    spot.building,
    spot.typeLabel,
    spot.isOpen ? "open" : "closed",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getFilterLabel(filter: DashboardFilter) {
  switch (filter) {
    case "near-me":
      return "Near Me";
    case "top-rated":
      return "Top Rated";
    case "worst-rated":
      return "Worst Rated";
    case "gender-neutral":
      return "Gender Neutral";
    case "accessible":
      return "Accessible";
    default:
      return "All Spots";
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [spots, setSpots] = useState<BathroomSpot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [activePanel, setActivePanel] = useState<"map" | "detail">("map");
  const [selectedBathroomId, setSelectedBathroomId] = useState<string | null>(
    null
  );
  const [hoveredBathroomId, setHoveredBathroomId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const selectedSpotRef = useRef<HTMLDivElement | null>(null);

  const refreshSpots = async () => {
    try {
      const nextSpots = await fetchBathroomSpots();
      setSpots(nextSpots);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load bathrooms."
      );
    }
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session?.user) {
        router.replace("/");
        return;
      }

      try {
        const nextSpots = await fetchBathroomSpots();

        if (!active) {
          return;
        }

        setSpots(nextSpots);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load bathrooms."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/");
        }
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (
      activeFilter !== "near-me" ||
      userLocation ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }

    let cancelled = false;
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!cancelled) {
          setUserLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        }
      },
      () => {
        if (!cancelled) {
          setLocationError("Location unavailable. Showing the default order.");
        }
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 5000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, [activeFilter, userLocation]);

  const buildingOptions = useMemo(() => {
    return Array.from(
      new Set(
        spots
          .map((spot) => spot.building?.trim())
          .filter((building): building is string => Boolean(building))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [spots]);

  const filteredSpots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let results = spots.filter((spot) => matchesSearch(spot, query));

    if (selectedBuilding !== "all") {
      results = results.filter((spot) => spot.building === selectedBuilding);
    }

    switch (activeFilter) {
      case "top-rated":
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case "worst-rated":
        results = [...results].sort((a, b) => a.rating - b.rating);
        break;
      case "gender-neutral":
        results = results.filter((spot) => spot.type === "gender-neutral");
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case "accessible":
        results = results.filter((spot) => spot.type === "accessible");
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case "near-me":
        if (userLocation) {
          results = [...results].sort(
            (a, b) =>
              getDistanceInMiles(userLocation, a) -
              getDistanceInMiles(userLocation, b)
          );
        }
        break;
      default:
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
    }

    return results;
  }, [spots, searchQuery, activeFilter, selectedBuilding, userLocation]);

  useEffect(() => {
    if (
      selectedBathroomId &&
      !filteredSpots.some((spot) => spot.id === selectedBathroomId)
    ) {
      setSelectedBathroomId(null);
      setActivePanel("map");
    }
  }, [filteredSpots, selectedBathroomId]);

  const sidebarSpots = useMemo(() => {
    if (activePanel !== "map" || !selectedBathroomId) {
      return filteredSpots;
    }

    const selectedSpot = filteredSpots.find(
      (spot) => spot.id === selectedBathroomId
    );

    return selectedSpot ? [selectedSpot] : filteredSpots;
  }, [activePanel, filteredSpots, selectedBathroomId]);

  useEffect(() => {
    if (!selectedBathroomId || !selectedSpotRef.current) {
      return;
    }

    selectedSpotRef.current.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [selectedBathroomId, sidebarSpots]);

  const handleMarkerClick = (bathroomId: string) => {
    setActivePanel("map");
    setSelectedBathroomId((current) =>
      current === bathroomId ? null : bathroomId
    );
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-amber-50">
        <Navbar />
        <ToiletBG />
        <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-xl bg-rose-100 p-8 text-center font-rubik text-amber-900 shadow-lg">
            Loading dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <ToiletBG />

      <div className="relative z-10 grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:h-[calc(100vh-5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:overflow-hidden">
        <aside className="border-b border-amber-900/20 bg-white/90 p-6 backdrop-blur-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-b-0 lg:p-8">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-900/80"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSelectedBathroomId(null);
                setActivePanel("map");
              }}
              placeholder="Search poop spots..."
              className="h-12 w-full rounded-full border border-amber-900/60 bg-white pl-11 pr-5 text-amber-900 placeholder:text-amber-900/60 transition focus:outline-none focus:ring-2 focus:ring-amber-900"
            />
          </div>

          <div className="mt-7 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-rubik text-2xl font-semibold text-amber-900">
                Poop Spots
              </h2>
              <p className="font-rubik text-sm text-gray-500">
                {filteredSpots.length} result
                {filteredSpots.length === 1 ? "" : "s"} •{" "}
                {getFilterLabel(activeFilter)}
                {selectedBuilding !== "all" ? ` • ${selectedBuilding}` : ""}
              </p>
              <button
                type="button"
                onClick={() => router.push("/add-review")}
                className="mt-4 w-full rounded-full bg-amber-900 px-4 py-2 font-semibold text-white hover:bg-amber-800"
              >
                Add Review
              </button>
            </div>

            <FilterDropdown
              value={activeFilter}
              onChange={(value) => {
                setActiveFilter(value);
                setSelectedBathroomId(null);
                setActivePanel("map");
              }}
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="building-filter"
              className="mb-2 block font-rubik text-sm font-medium text-amber-900"
            >
              Building
            </label>

            <div className="relative">
              <select
                id="building-filter"
                value={selectedBuilding}
                onChange={(event) => {
                  setSelectedBuilding(event.target.value)
                  setSelectedBathroomId(null)
                  setActivePanel("map")
                }}
                className="h-11 w-full appearance-none rounded-xl border border-amber-900/30 bg-white px-4 pr-10 font-rubik text-sm text-amber-900 outline-none transition focus:ring-2 focus:ring-amber-900 hover:cursor-pointer">
                <option value="all">All Buildings</option>

                {buildingOptions.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
                ))}
              </select>

              <ChevronDown 
                className= "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-900 transition-transform duration-200"
              />
            </div>
          </div>

          {activePanel === "map" && selectedBathroomId ? (
            <button
              type="button"
              onClick={() => {
                setSelectedBathroomId(null);
                setActivePanel("map");
              }}
              className="mt-4 rounded-xl border pr-3 border-amber-900/30 bg-amber-50 px-4 py-2 font-rubik text-sm text-amber-900 transition hover:bg-amber-100"
            >
              Show all spots again
            </button>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-rubik text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {activeFilter === "near-me" && locationError ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 font-rubik text-sm text-amber-900">
              {locationError}
            </p>
          ) : null}

          <div className="mt-5 space-y-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-6 lg:pr-2">
            {sidebarSpots.map((spot) => (
              <div
                key={spot.id}
                ref={spot.id === selectedBathroomId ? selectedSpotRef : null}
                onMouseEnter={() => setHoveredBathroomId(spot.id)}
                onMouseLeave={() => setHoveredBathroomId(null)}
              >
                <SpotCard
                  spot={spot}
                  onClick={() => {
                    setSelectedBathroomId(spot.id);
                    setActivePanel("detail");
                  }}
                  isSelected={spot.id === selectedBathroomId}
                />
              </div>
            ))}

            {sidebarSpots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-amber-900/50 bg-amber-50 p-4 font-rubik text-sm text-gray-600">
                No spots match your search and filter yet.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="relative min-h-[500px] overflow-hidden lg:h-full lg:min-h-0">
          {activePanel === "detail" && selectedBathroomId ? (

            <BathroomDetailPanel
              bathroomId={selectedBathroomId}
              onBack={() => setActivePanel("map")}
              backLabel="Back to map"
              onReviewSaved={() => void refreshSpots()}
            />
        
          ) : !errorMessage ? (
            <div className="absolute inset-0">
              <BathroomMap
                bathrooms={filteredSpots}
                selectedBathroomId={selectedBathroomId}
                hoveredBathroomId={hoveredBathroomId}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
