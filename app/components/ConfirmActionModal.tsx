"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isConfirming, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
      onClick={() => {
        if (!isConfirming) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-amber-900/10 bg-rose-100 shadow-[0_30px_100px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-amber-900/10 px-6 py-5 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.14)]">
              <AlertTriangle size={22} strokeWidth={2.2} />
            </div>

            <div>
              <p className="font-rubik text-[11px] uppercase tracking-[0.24em] text-amber-900/55">
                Confirm Delete
              </p>
              <h2
                id="confirm-action-title"
                className="mt-2 font-gasoek text-3xl text-amber-900"
              >
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-white/60 bg-white/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="font-rubik text-lg leading-8 text-slate-700">
              {description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isConfirming}
              className="rounded-full border border-amber-900/20 bg-white px-5 py-2.5 font-rubik text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className="rounded-full bg-red-700 px-5 py-2.5 font-rubik text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isConfirming ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
