"use client"

import { useEffect, useState } from "react"

export default function Avatar({
  size = 96,
  src,
}: {
  size?: number
  src?: string
}) {
  const fallbackSrc = "/assets/default-avatar.svg"

  const normalizedSrc =
    src && src.trim().length > 0 ? src : fallbackSrc

  const [imgSrc, setImgSrc] = useState(normalizedSrc)
  const isFallbackImage = imgSrc === fallbackSrc

  useEffect(() => {
    setImgSrc(normalizedSrc)
  }, [normalizedSrc])

  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200"
    >
      <img
        src={imgSrc}
        alt="Profile avatar"
        style={
          isFallbackImage
            ? {
                width: Math.round(size * 0.66),
                height: Math.round(size * 0.66),
              }
            : {
                width: "100%",
                height: "100%",
              }
        }
        className={isFallbackImage ? "object-contain object-center" : "object-cover"}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc)
          }
        }}
      />
    </div>
  )
}
