"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

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

interface BathroomMapProps {
  bathrooms: Bathroom[];
  selectedBathroomId: string | null;
  hoveredBathroomId: string | null;
  onMarkerClick: (bathroomId: string) => void;
}

const defaultCenter: [number, number] = [34.06025, -118.4452];

function makeIcon(url: string, size: number, anchorRatio = 1) {
  return new L.Icon({
    iconUrl: url,
    iconSize: [size, size],
    iconAnchor: [size / 2, size * anchorRatio],
  });
}

function getMarkerSizes(zoom: number) {
  const baseZoom = 16;
  const zoomDiff = zoom - baseZoom;

  const regularBase = 26;
  const selectedBase = 29;
  const locationBase = 21;

  const scale = Math.max(0.7, Math.min(1.35, 1 + zoomDiff * 0.12));

  return {
    regular: Math.round(regularBase * scale),
    selected: Math.round(selectedBase * scale),
    current: Math.round(locationBase * scale),
  };
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


function FlyToBathroom({
  bathrooms,
  selectedBathroomId,
}: {
  bathrooms: Bathroom[];
  selectedBathroomId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedBathroomId) return;

    const selectedBathroom = bathrooms.find(
      (bathroom) => bathroom.id === selectedBathroomId
    );

    if (!selectedBathroom) return;

    const zoomLevel = 18;

    const targetLatLng = L.latLng(
      selectedBathroom.latitude,
      selectedBathroom.longitude
    );

    const projected = map.project(targetLatLng, zoomLevel);

    // adjust this number to fine-tune vertical centering
    const offsetPoint = L.point(projected.x, projected.y + 500);

    const offsetLatLng = map.unproject(offsetPoint, zoomLevel);

    map.flyTo(offsetLatLng, zoomLevel, {
      duration: 0.8,
    });
  }, [bathrooms, selectedBathroomId, map]);

  return null;
}

function ZoomAwareMarkers({
  bathrooms,
  selectedBathroomId,
  hoveredBathroomId,
  onMarkerClick,
  userLocation,
}: {
  bathrooms: Bathroom[];
  selectedBathroomId: string | null;
  hoveredBathroomId: string | null;
  onMarkerClick: (bathroomId: string) => void;
  userLocation: [number, number] | null;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });

  const sizes = useMemo(() => getMarkerSizes(zoom), [zoom]);

  const bathroomIcon = useMemo(
    () => makeIcon("/assets/bathroom-marker.png", sizes.regular, 1),
    [sizes.regular]
  );

  const selectedIcon = useMemo(
    () => makeIcon("/assets/selected-bathroom.png", sizes.selected, 1),
    [sizes.selected]
  );

  const currentLocationIcon = useMemo(
    () => makeIcon("/assets/cur-loc.png", sizes.current, 0.5),
    [sizes.current]
  );

  return (
    <>
      {userLocation ? (
        <Marker position={userLocation} icon={currentLocationIcon} />
      ) : null}

      {bathrooms.map((bathroom) => {
        const isHighlighted =
          bathroom.id === selectedBathroomId ||
          bathroom.id === hoveredBathroomId;

        return (
          <Marker
            key={bathroom.id}
            position={[bathroom.latitude, bathroom.longitude]}
            icon={isHighlighted ? selectedIcon : bathroomIcon}
            eventHandlers={{
              click: () => onMarkerClick(bathroom.id),
            }}
          />
        );
      })}
    </>
  );
}

export default function BathroomMap({
  bathrooms,
  selectedBathroomId,
  hoveredBathroomId,
  onMarkerClick,
}: BathroomMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  }, []);

  const bounds = useMemo<L.LatLngBoundsExpression>(
    () => [
      [34.0595, -118.4555],
      [34.0785, -118.435],
    ],
    []
  );

  return (
    <div className="h-full w-full overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={16}
        minZoom={15}
        maxZoom={18}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        className="h-full w-full"
      >
        <MapResizer />

        <FlyToBathroom
          bathrooms={bathrooms}
          selectedBathroomId={selectedBathroomId}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomAwareMarkers
          bathrooms={bathrooms}
          selectedBathroomId={selectedBathroomId}
          hoveredBathroomId={hoveredBathroomId}
          onMarkerClick={onMarkerClick}
          userLocation={userLocation}
        />
      </MapContainer>
    </div>
  );
}