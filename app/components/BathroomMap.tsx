"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { bathrooms } from "../data/bathrooms";
import SpotCard from "./SpotCard";

interface Bathroom {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  gender: string;
  accessible: boolean;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  typeLabel: string;
}

const bathroomIcon = L.icon({
  iconUrl: "/assets/bathroom-marker.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

const currentLocationIcon = L.icon({
  iconUrl: "/assets/cur-loc.png",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -10],
});

export default function BathroomMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  const center: [number, number] = [34.0705, -118.442];

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      () => {
        console.log("Location permission denied");
      }
    );
  }, []);

  return (
    <MapContainer
      center={userLocation ?? center}
      zoom={16}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {bathrooms.map((bathroom: Bathroom) => (
        <Marker
          key={bathroom.id}
          position={[bathroom.lat, bathroom.lng]}
          icon={bathroomIcon}
        >
          <Popup closeButton={false} offset={[0, -24]}>
            <div className="w-[280px]">
              <SpotCard spot={bathroom} />
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && (
        <Marker position={userLocation} icon={currentLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}