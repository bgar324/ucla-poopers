"use client"

import { useEffect, useState } from "react"

export default function Avatar({
  size = 96,
  src,
}: {
  size?: number
  src?: string
}) {
  const fallbackSrc = "/assets/placeholder.png"

  const normalizedSrc =
    src && src.trim().length > 0 ? src : fallbackSrc

  const [imgSrc, setImgSrc] = useState(normalizedSrc)

  useEffect(() => {
    setImgSrc(normalizedSrc)
  }, [normalizedSrc])

  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full "
    >
      <img
        src={imgSrc}
        alt="Profile avatar"
        style={{
          width: "100%",
          height: "100%",
        }}
        className="object-cover"
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc)
          }
        }}
      />
    </div>
  )
}
