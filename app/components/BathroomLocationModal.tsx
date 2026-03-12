"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";

const BathroomLocationPicker = dynamic(
  () => import("./BathroomLocationPicker").then((mod) => mod.default),
  { ssr: false }
);

interface BathroomLocationModalProps {
  isOpen: boolean;
  bathroomName: string;
  initialLatitude: number;
  initialLongitude: number;
  isSaving: boolean;
  errorMessage: string;
  onClose: () => void;
  onSave: (latitude: number, longitude: number) => void;
}

function coordinatesMatch(
  latitudeA: number | null,
  longitudeA: number | null,
  latitudeB: number,
  longitudeB: number
) {
  if (latitudeA === null || longitudeA === null) {
    return false;
  }

  const epsilon = 0.0000005;

  return (
    Math.abs(latitudeA - latitudeB) < epsilon &&
    Math.abs(longitudeA - longitudeB) < epsilon
  );
}

export default function BathroomLocationModal({
  isOpen,
  bathroomName,
  initialLatitude,
  initialLongitude,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: BathroomLocationModalProps) {
  const [draftLatitude, setDraftLatitude] = useState<number | null>(initialLatitude);
  const [draftLongitude, setDraftLongitude] = useState<number | null>(initialLongitude);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftLatitude(initialLatitude);
    setDraftLongitude(initialLongitude);
    setIsConfirmed(false);
  }, [initialLatitude, initialLongitude, isOpen]);

  const hasChanged = useMemo(
    () =>
      !coordinatesMatch(
        draftLatitude,
        draftLongitude,
        initialLatitude,
        initialLongitude
      ),
    [draftLatitude, draftLongitude, initialLatitude, initialLongitude]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={() => {
        if (!isSaving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bathroom-location-modal-title"
        className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-amber-900/10 bg-rose-100 shadow-[0_30px_100px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-amber-900/10 px-6 py-5 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.12)]">
              <MapPinned size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="bathroom-location-modal-title"
                className="mt-1 font-gasoek text-3xl text-amber-900"
              >
                Move restroom pin
              </h2>
              <p className="mt-2 font-rubik text-base text-slate-600">
                Adjust the saved location for {bathroomName}, confirm the new pin,
                then save it.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 lg:px-8">
          <BathroomLocationPicker
            latitude={draftLatitude}
            longitude={draftLongitude}
            isConfirmed={isConfirmed}
            onLocationChange={(latitude, longitude) => {
              setDraftLatitude(latitude);
              setDraftLongitude(longitude);
              setIsConfirmed(false);
            }}
            onConfirm={() => setIsConfirmed(true)}
          />

          {errorMessage ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-rubik text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-full border border-amber-900/20 bg-white px-5 py-2.5 font-rubik text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (draftLatitude === null || draftLongitude === null) {
                  return;
                }

                onSave(draftLatitude, draftLongitude);
              }}
              disabled={
                isSaving ||
                draftLatitude === null ||
                draftLongitude === null ||
                !hasChanged ||
                !isConfirmed
              }
              className="rounded-full bg-amber-900 px-5 py-2.5 font-rubik text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save new pin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
