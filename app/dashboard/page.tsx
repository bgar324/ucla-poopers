import Navbar from "@/app/components/Navbar";
import search from "lucide-react";
import ToiletBG from "../components/ToiletBG";

export default function Dashboard() {
    return (    
        <main> 
            <Navbar />
            <div className = "min-h-screen grid grid-cols-3">
                {/* LEFT COLUMN */}
                <div className="col-span-1 bg-white border-r border-amber-900 p-8 space-y-8">

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search poop spots..."
                            className="
                                w-full h-12 px-6
                                rounded-full
                                text-amber-900
                                placeholder:text-amber-900
                                border border-amber-900
                                focus:outline-none
                                focus:ring-2
                                focus:ring-amber-900
                                transition"
                        />
                    </div>

                    <div>
                        <h2 className="font-rubik text-2xl font-semibold text-amber-900">
                            Poop Spots
                        </h2>
                            
                        <p className="text-sm text-gray-500">
                            12 results
                        </p>
                    </div>

                <div className="
                    bg-rose-50
                    border border-amber-900
                    rounded-xl
                    p-5
                    shadow-sm
                    hover:shadow-md
                    hover:-translate-y-1
                    transition
                    cursor-pointer
                    ">
                    <p className="font-medium text-amber-900">
                        Example Result
                    </p>
                </div>

            </div>

            {/* RIGHT CONTENT */}
            <div className="col-span-2 p-6">
                <h1>Main Content</h1>
            </div>
            
        </div>
    </main>
    );
}