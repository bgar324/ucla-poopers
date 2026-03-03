"use client";

import Navbar from "@/app/components/Navbar";
import supabase from "@/supabaseClient";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ToiletBG from "../components/ToiletBG";
import SpotCard from "../components/SpotCard";
import FilterDropdown from "../components/FilterDropdown";

interface SpotItem {
  id: string;
  rating: number;
  name: string;
  detail: string;
}

const SPOTS: SpotItem[] = [
  { id: "1", 
    rating: 4,
    name: "Boelter Hall 1F", 
    detail: "Near the main lecture rooms" },
  {
    id: "2",
    rating: 5,
    name: "Powell Library 2F",
    detail: "Quiet corner by study stacks",
  },
  {
    id: "3",
    rating: 3,
    name: "Kerckhoff Hall B1",
    detail: "Fastest option between classes",
  },
  {
    id: "4",
    rating: 4,
    name: "Ackerman Union 3F",
    detail: "Good traffic flow, usually open",
  },
  {
    id: "5",
    rating: 2,
    name: "Young Research Library",
    detail: "Wide stalls and clean counters",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return SPOTS;
    }

    return SPOTS.filter(
      (spot) =>
        spot.name.toLowerCase().includes(query) ||
        spot.detail.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
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

      setIsLoading(false);
    };

    void loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/");
        }
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-amber-50">
        <Navbar />
        <ToiletBG />
        <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-xl bg-rose-100 p-8 text-center shadow-lg font-rubik text-amber-900">
            Loading dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      
      <div className="relative z-10 grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-3">
        <aside className="border-b border-amber-900/20 bg-white/90 p-6 backdrop-blur-sm lg:border-r lg:border-b-0 lg:p-8">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-900/80"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search poop spots..."
              className="h-12 w-full rounded-full border border-amber-900/60 bg-white pl-11 pr-5 text-amber-900 placeholder:text-amber-900/60 focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
            />
          </div>

          <div className="mt-7">
            <h2 className="font-rubik text-2xl font-semibold text-amber-900">
              Poop Spots <FilterDropdown />
            </h2>
            <p className="font-rubik text-sm text-gray-500">
              {filteredSpots.length} result
              {filteredSpots.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* <div> 

            <button className = "px-4 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition"> 
              Near Me
            </button> 

            <button className = "px-4 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition"> 
              Accessible
            </button>

             <button className = "px-4 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition"> 
              Gender Neutral
            </button>

            <button className = "px-4 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition"> 
              Top Rated
            </button> 

            <button className = "px-4 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition"> 
              Worst Rated
            </button> 

          </div> */}

          <div className="mt-5 space-y-3">
             {filteredSpots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}

            {filteredSpots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-amber-900/50 bg-amber-50 p-4 font-rubik text-sm text-gray-600">
                No spots match your search yet.
              </p>
            ) : null}
          </div>
        </aside>
        <div className="col-span-2 p-6">
          <h1>Main Content</h1>
        </div>
      </div>
    </main>
  );
}
