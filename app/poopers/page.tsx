"use client"

import Navbar from "../components/Navbar"
import SpotCard from "../components/SpotCard"
import ToiletBG from "../components/ToiletBG"
import { useState } from "react"
import Avatar from "../components/UserAvatar"

export default function PoopersProfilePage() {
  const [activeFilter, setActiveFilter] = useState("recent")

  const filters = [
    { label: "Recent", value: "recent" },
    { label: "Top Rated", value: "top" },
    { label: "Worst Rated", value: "worst" },
  ]

  return (
    <main>
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-3 min-h-screen">
        
        {/* Left 1/3 */}
        <aside className="md:col-span-1 bg-gray-100 p-6">
           <div className="flex flex-col items-center text-center space-y-2">
    
                {/* Avatar */}
                <Avatar size={220} />

                {/* Username */}
                <h2 className="text-2xl font-semibold mt-2">
                    Joe Bruin
                </h2>

                {/* First + Last Name */}
                <p className="text-gray-600 text-lg">
                    @joetheking
                </p>

           
            </div>
        </aside>

        {/* Right 2/3 */}
        <section className="md:col-span-2 p-6">
        

          {/* Filter Buttons */}
          <div className="flex gap-4 mb-6">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-1 w-1/3 border border-2 cursor-pointer cursor-hover:-y-0.5 transition-all duration-200
                  ${
                    activeFilter === filter.value
                      ? "bg-amber-900 text-white border-amber-900"
                      : "bg-white text-amber-900 border-amber-900 hover:bg-amber-100"
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Example Content Area */}
          <div>
            <p className="text-gray-600">
              Currently viewing: <span className="font-semibold">{activeFilter}</span>
            </p>

            {/* Later you can render filtered SpotCards here */}
            
          </div>

        </section>

      </div>
    </main>
  )
}