"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const CROP_SIZE = 320;
const OUTPUT_SIZE = 512;

interface Point {
  x: number;
  y: number;
}

interface AvatarCropModalProps {
  file: File;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => Promise<void> | void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function AvatarCropModal({
  file,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [localError, setLocalError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const dragOriginRef = useRef<Point | null>(null);

  useEffect(() => {
    const nextImageUrl = URL.createObjectURL(file);
    setImageUrl(nextImageUrl);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setLocalError("");

    const nextImage = new Image();
    nextImage.onload = () => {
      setImage(nextImage);
    };
    nextImage.onerror = () => {
      setLocalError("We couldn't open that image.");
      setImage(null);
    };
    nextImage.src = nextImageUrl;

    return () => {
      URL.revokeObjectURL(nextImageUrl);
    };
  }, [file]);

  const layout = useMemo(() => {
    if (!image) {
      return null;
    }

    const baseScale = Math.max(CROP_SIZE / image.width, CROP_SIZE / image.height);
    const scale = baseScale * zoom;
    const width = image.width * scale;
    const height = image.height * scale;
    const maxX = Math.max(0, (width - CROP_SIZE) / 2);
    const maxY = Math.max(0, (height - CROP_SIZE) / 2);
    const x = clamp(position.x, -maxX, maxX);
    const y = clamp(position.y, -maxY, maxY);

    return {
      scale,
      width,
      height,
      x,
      y,
      left: (CROP_SIZE - width) / 2 + x,
      top: (CROP_SIZE - height) / 2 + y,
    };
  }, [image, position.x, position.y, zoom]);

  useEffect(() => {
    if (!layout) {
      return;
    }

    if (layout.x !== position.x || layout.y !== position.y) {
      setPosition({ x: layout.x, y: layout.y });
    }
  }, [layout, position.x, position.y]);

  const isBusy = isSubmitting || isExporting;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!layout || isBusy) {
      return;
    }

    dragOriginRef.current = {
      x: event.clientX - layout.x,
      y: event.clientY - layout.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!layout || !dragOriginRef.current || isBusy) {
      return;
    }

    const nextX = event.clientX - dragOriginRef.current.x;
    const nextY = event.clientY - dragOriginRef.current.y;
    const maxX = Math.max(0, (layout.width - CROP_SIZE) / 2);
    const maxY = Math.max(0, (layout.height - CROP_SIZE) / 2);

    setPosition({
      x: clamp(nextX, -maxX, maxX),
      y: clamp(nextY, -maxY, maxY),
    });
  };

  const endPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOriginRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleConfirm = async () => {
    if (!image || !layout) {
      return;
    }

    setLocalError("");
    setIsExporting(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image cropper is unavailable.");
      }

      const sourceX = (0 - layout.left) / layout.scale;
      const sourceY = (0 - layout.top) / layout.scale;
      const sourceSize = CROP_SIZE / layout.scale;

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.92);
      });

      if (!blob) {
        throw new Error("Failed to prepare cropped image.");
      }

      const nextBaseName =
        file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-") ||
        "avatar";
      const croppedFile = new File([blob], `${nextBaseName}.webp`, {
        type: "image/webp",
      });

      await onConfirm(croppedFile);
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to crop image.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const previewScale = layout ? 96 / CROP_SIZE : 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-rose-100 shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-amber-900/10 px-6 py-5 lg:px-8">
          <div>
            <p className="font-rubik text-[11px] uppercase tracking-[0.24em] text-amber-900/60">
              Crop Profile Photo
            </p>
            <h2 className="mt-2 font-gasoek text-3xl text-amber-900">
              Adjust your avatar
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-full border border-amber-900/25 bg-white/70 px-4 py-2 font-rubik text-sm text-amber-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>

        <div className="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-8">
          <section>
            <div className="rounded-[1.75rem] border border-amber-900/10 bg-white/45 p-5">
              <div
                className="relative mx-auto h-[320px] w-[320px] touch-none overflow-hidden rounded-[2rem] bg-amber-50 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.08)]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endPointerDrag}
                onPointerCancel={endPointerDrag}
              >
                {imageUrl && layout ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Avatar crop preview"
                      draggable={false}
                      className="pointer-events-none absolute max-w-none select-none"
                      style={{
                        width: layout.width,
                        height: layout.height,
                        left: layout.left,
                        top: layout.top,
                      }}
                    />

                    <div className="pointer-events-none absolute inset-0 bg-black/20" />
                    <div className="pointer-events-none absolute inset-[18px] rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.24)]" />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center font-rubik text-sm text-gray-500">
                    Preparing image...
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between font-rubik text-sm text-gray-600">
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  disabled={!layout || isBusy}
                  className="mt-3 h-2 w-full cursor-pointer accent-amber-900"
                />
              </div>
            </div>

            <p className="mt-4 font-rubik text-sm text-slate-600">
              Drag the image to reposition it. Use zoom to frame your face the
              way you want before upload.
            </p>
          </section>

          <aside className="rounded-[1.75rem] border border-amber-900/10 bg-white/55 p-6">
            <p className="font-rubik text-[11px] uppercase tracking-[0.24em] text-amber-900/60">
              Live Preview
            </p>

            <div className="mt-5 flex justify-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white bg-amber-50 shadow-md">
                {imageUrl && layout ? (
                  <img
                    src={imageUrl}
                    alt="Circular avatar preview"
                    draggable={false}
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                      width: layout.width * previewScale,
                      height: layout.height * previewScale,
                      left: layout.left * previewScale,
                      top: layout.top * previewScale,
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-3 font-rubik text-sm text-slate-600">
              <p>The final avatar is exported as a square image for consistency.</p>
              <p>The round preview shows how it will appear around the app.</p>
            </div>

            {localError ? (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-rubik text-sm text-red-700">
                {localError}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!layout || isBusy}
                className="flex-1 rounded-xl bg-amber-900 px-4 py-3 font-rubik text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isBusy ? "Saving..." : "Use This Crop"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
