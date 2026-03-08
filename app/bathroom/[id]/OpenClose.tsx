"use client";

import { useState } from "react";

interface OpenCloseProps {
  bathroomId: string;
  initialIsOpen: boolean;
}

export default function OpenClose({
  bathroomId,
  initialIsOpen,
}: OpenCloseProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isSaving, setIsSaving] = useState(false);

  async function toggleBathroomStatus() {
    try {
      setIsSaving(true);

      const res = await fetch(`/api/bathrooms/${bathroomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: !isOpen }),
      });

      if (!res.ok) {
        throw new Error("Failed to update bathroom status");
      }

      setIsOpen((prev) => !prev);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <p
        className={`font-rubik rounded-lg px-3 py-1 text-sm inline-block ${
          isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
        }`}
      >
        {isOpen ? "Open now" : "Closed"}
      </p>

      <button
        type="button"
        onClick={toggleBathroomStatus}
        disabled={isSaving}
        className="inline-flex rounded-lg bg-amber-900 px-3 py-1 font-rubik text-sm text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {isSaving ? "Updating..." : isOpen ? "Report Closed" : "Report Open"}
      </button>
    </div>
  );
}