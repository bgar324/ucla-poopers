"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { bathrooms } from "../data/bathrooms";

export default function BathroomMap() {
    const[query, setQuery] = useState("");

    const filteredBathrooms = useMemo(() => {
        return bathrooms.filter((bathroom) =>
            bathroom.name.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);

    const position: [number, number] = [34.0689, -118.4452];

    return (
        <div>
            <input
                type="text"
                placeholder="Search bathrooms..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <div>
                <div>
                    {filteredBathrooms.length === 0 ? (
                        <p>No bathrooms found.</p>
                    ) : (
                        filteredBathrooms.map((bathroom) => (
                            <div key={bathroom.id}>
                                <p>{bathroom.name}</p>
                                <p>
                                    {bathroom.gender}
                                    {bathroom.accessible ? "Accessible" : "Not Accessible"}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <MapContainer
                        center={position}
                        zoom={16}
                        scrollWheelZoom={true}
                        className="h-[500px] w-full"
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {filteredBathrooms.map((bathroom) => (
                            <Marker
                                key={bathroom.id}
                                position={[bathroom.lat, bathroom.lng]}
                            >
                                <Popup>
                                    <div>
                                        <p>{bathroom.name}</p>
                                        <p>{bathroom.gender}</p>
                                        <p>{bathroom.accessible ? "Accessible" : "Not Accessible"}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}