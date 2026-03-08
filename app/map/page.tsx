"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import BathroomDetailPanel from "../components/BathroomDetailPanel";
import FilterDropdown, {
  type DashboardFilter,
} from "../components/FilterDropdown";
import SpotCard from "../components/SpotCard";

interface Bathroom {
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

const BathroomMap = dynamic(
  () => import("../components/BathroomMap").then((mod) => mod.default),
  { ssr: false }
);

function matchesSearch(bathroom: Bathroom, query: string) {
  if (!query) return true;

  const haystack = [
    bathroom.name,
    bathroom.detail,
    bathroom.building,
    bathroom.typeLabel,
    bathroom.isOpen ? "open" : "closed",
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

export default function MapPage() {
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [activePanel, setActivePanel] = useState<"map" | "detail">("map");
  const [selectedBathroomId, setSelectedBathroomId] = useState<string | null>(
    null
  );
  const [hoveredBathroomId, setHoveredBathroomId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;

    const loadBathrooms = async () => {
      try {
        const response = await fetch("/api/bathrooms");
        const data = (await response.json().catch(() => null)) as
          | { bathrooms?: Bathroom[]; error?: string }
          | null;

        if (!active) return;

        if (!response.ok || !data?.bathrooms) {
          throw new Error(data?.error ?? "Failed to load bathrooms.");
        }

        setBathrooms(data.bathrooms);
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load bathrooms."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadBathrooms();

    return () => {
      active = false;
    };
  }, []);

  const filteredBathrooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let results = bathrooms.filter((bathroom) =>
      matchesSearch(bathroom, query)
    );

    switch (activeFilter) {
      case "top-rated":
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
      case "worst-rated":
        results = [...results].sort((a, b) => a.rating - b.rating);
        break;
      case "gender-neutral":
        results = results.filter(
          (bathroom) => bathroom.type === "gender-neutral"
        );
        break;
      case "accessible":
        results = results.filter((bathroom) => bathroom.type === "accessible");
        break;
      case "near-me":
        break;
      default:
        break;
    }

    return results;
  }, [bathrooms, searchQuery, activeFilter]);

  useEffect(() => {
    if (
      selectedBathroomId &&
      !filteredBathrooms.some((bathroom) => bathroom.id === selectedBathroomId)
    ) {
      setSelectedBathroomId(null);
      setActivePanel("map");
    }
  }, [filteredBathrooms, selectedBathroomId]);

  const sidebarBathrooms = useMemo(() => {
    if (activePanel === "map" && selectedBathroomId) {
      const selectedBathroom = filteredBathrooms.find(
        (bathroom) => bathroom.id === selectedBathroomId
      );

      return selectedBathroom ? [selectedBathroom] : filteredBathrooms;
    }

    return filteredBathrooms;
  }, [activePanel, filteredBathrooms, selectedBathroomId]);

  const handleMarkerClick = (bathroomId: string) => {
    setActivePanel("map");
    setSelectedBathroomId((current) =>
      current === bathroomId ? null : bathroomId
    );
  };

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />

      <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:h-[calc(100vh-5rem)] lg:grid-cols-[360px_minmax(0,1fr)] lg:overflow-hidden">
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
              }}
              placeholder="Search poop spots..."
              className="h-12 w-full rounded-full border border-amber-900/60 bg-white pl-11 pr-5 text-amber-900 placeholder:text-amber-900/60 transition focus:outline-none focus:ring-2 focus:ring-amber-900"
            />
          </div>

          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-rubik text-2xl font-semibold text-amber-900">
                Poop Spots
              </h2>

              <p className="font-rubik text-sm text-gray-500">
                {filteredBathrooms.length} result
                {filteredBathrooms.length === 1 ? "" : "s"} •{" "}
                {getFilterLabel(activeFilter)}
              </p>
            </div>

            <FilterDropdown
              value={activeFilter}
              onChange={(value) => {
                setActiveFilter(value);
                setSelectedBathroomId(null);
              }}
            />
          </div>

          {activePanel === "map" && selectedBathroomId ? (
            <button
              type="button"
              onClick={() => {
                setSelectedBathroomId(null);
                setActivePanel("map");
              }}
              className="mt-4 rounded-xl border border-amber-900/30 bg-amber-50 px-4 py-2 font-rubik text-sm text-amber-900 transition hover:bg-amber-100"
            >
              Show all spots again
            </button>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-rubik text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {isLoading ? (
            <p className="mt-4 font-rubik text-sm text-amber-900">
              Loading map...
            </p>
          ) : (
            <div className="mt-5 space-y-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-6 lg:pr-2">
              {sidebarBathrooms.map((bathroom) => (
                <div
                  key={bathroom.id}
                  onMouseEnter={() => setHoveredBathroomId(bathroom.id)}
                  onMouseLeave={() => setHoveredBathroomId(null)}
                >
                  <SpotCard
                    spot={bathroom}
                    onClick={() => {
                      setSelectedBathroomId(bathroom.id)
                      setActivePanel("detail")
                    }}
                    isSelected={bathroom.id === selectedBathroomId}
                  />
                </div>
              ))}

              {sidebarBathrooms.length === 0 ? (
                <p className="rounded-xl border border-dashed border-amber-900/50 bg-amber-50 p-4 font-rubik text-sm text-gray-600">
                  No spots match your search and filter yet.
                </p>
              ) : null}
            </div>
          )}
        </aside>

        <section className="relative min-h-[500px] lg:h-full lg:min-h-0">
          {activePanel === "detail" && selectedBathroomId ? (
            <BathroomDetailPanel
              bathroomId={selectedBathroomId}
              onBackToMap={() => setActivePanel("map")}
            />
          ) : (
            <div className="absolute inset-0">
              {!isLoading && !errorMessage ? (
                <BathroomMap
                  bathrooms={filteredBathrooms}
                  selectedBathroomId={selectedBathroomId}
                  hoveredBathroomId={hoveredBathroomId}
                  onMarkerClick={handleMarkerClick}
                />
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
