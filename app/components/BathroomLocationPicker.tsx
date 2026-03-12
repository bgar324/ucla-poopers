"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CheckCircle2, LocateFixed, MapPin } from "lucide-react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

interface BathroomLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  isConfirmed: boolean;
  onLocationChange: (latitude: number, longitude: number) => void;
  onConfirm: () => void;
}

const fallbackCenter: [number, number] = [34.06925, -118.4452];
const defaultZoom = 18;

function requestCurrentPosition({
  onSuccess,
  onFailure,
}: {
  onSuccess: (latitude: number, longitude: number) => void;
  onFailure: () => void;
}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onFailure();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      onSuccess(coords.latitude, coords.longitude);
    },
    () => {
      onFailure();
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 300000,
    }
  );
}

function makePinIcon() {
  return new L.Icon({
    iconUrl: "/assets/selected-bathroom.png",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [map]);

  return null;
}

function SyncMapToPin({
  position,
}: {
  position: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.flyTo(position, Math.max(map.getZoom(), defaultZoom), {
      duration: 0.5,
    });
  }, [map, position]);

  return null;
}

function MapPinController({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (latitude: number, longitude: number) => void;
}) {
  const pinIcon = useMemo(() => makePinIcon(), []);

  useMapEvents({
    click(event) {
      onMove(event.latlng.lat, event.latlng.lng);
    },
  });

  return (
    <Marker
      draggable
      position={position}
      icon={pinIcon}
      eventHandlers={{
        dragend: (event) => {
          const nextPosition = (event.target as L.Marker).getLatLng();
          onMove(nextPosition.lat, nextPosition.lng);
        },
      }}
    />
  );
}

function formatCoordinate(value: number | null) {
  return value === null ? "--" : value.toFixed(6);
}

export default function BathroomLocationPicker({
  latitude,
  longitude,
  isConfirmed,
  onLocationChange,
  onConfirm,
}: BathroomLocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [helperText, setHelperText] = useState(
    "Start at your current location, then drag the pin until it sits exactly on the restroom."
  );
  const requestedInitialLocationRef = useRef(false);

  const position =
    latitude !== null && longitude !== null
      ? ([latitude, longitude] as [number, number])
      : null;

  const handleMovePin = (nextLatitude: number, nextLongitude: number) => {
    onLocationChange(nextLatitude, nextLongitude);
    setHelperText("Pin moved. Confirm this placement before submitting.");
  };

  const handleLocateMe = (origin: "initial" | "manual") => {
    setIsLocating(true);
    setHelperText(
      origin === "initial"
        ? "Finding your current location..."
        : "Refreshing the pin from your current location..."
    );

    requestCurrentPosition({
      onSuccess: (nextLatitude, nextLongitude) => {
        onLocationChange(nextLatitude, nextLongitude);
        setHelperText(
          "Pin started at your current location. Drag it if you need to fine-tune the restroom."
        );
        setIsLocating(false);
      },
      onFailure: () => {
        onLocationChange(fallbackCenter[0], fallbackCenter[1]);
        setHelperText(
          "Current location was unavailable, so the pin started at UCLA. Drag it to the correct restroom spot."
        );
        setIsLocating(false);
      },
    });
  };

  useEffect(() => {
    if (position || requestedInitialLocationRef.current) {
      return;
    }

    requestedInitialLocationRef.current = true;
    handleLocateMe("initial");
  }, [position]);

  return (
    <div className="rounded-2xl border border-amber-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-950">
            <MapPin className="h-4 w-4" />
            <p className="text-sm font-semibold">Restroom location</p>
          </div>
          <p className="text-sm text-amber-900/80">{helperText}</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => handleLocateMe("manual")}
          disabled={isLocating}
        >
          <LocateFixed className="h-4 w-4" />
          {isLocating ? "Locating..." : "Use my location"}
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100 bg-amber-100/40">
        <div className="h-72 w-full">
          <MapContainer
            center={position ?? fallbackCenter}
            zoom={defaultZoom}
            minZoom={15}
            maxZoom={20}
            scrollWheelZoom
            className="h-full w-full"
          >
            <MapResizer />
            <SyncMapToPin position={position} />
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position ? (
              <MapPinController position={position} onMove={handleMovePin} />
            ) : null}
          </MapContainer>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-stone-700">
          <p>
            Latitude: <span className="font-medium">{formatCoordinate(latitude)}</span>
          </p>
          <p>
            Longitude: <span className="font-medium">{formatCoordinate(longitude)}</span>
          </p>
          <p
            className={
              isConfirmed ? "font-medium text-emerald-700" : "font-medium text-amber-900"
            }
          >
            {isConfirmed
              ? "Location confirmed for submission."
              : "Pin placement still needs confirmation."}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onConfirm}
          disabled={position === null || isConfirmed}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isConfirmed ? "Pin confirmed" : "Confirm pin location"}
        </button>
      </div>
    </div>
  );
}
