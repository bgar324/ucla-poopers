"use client"

import { useEffect, useState } from "react"

export default function Avatar({
  size = 96,
  src,
}: {
  size?: number
  src?: string
}) {
  const fallbackSrc = "/assets/bear.png"

  const normalizedSrc =
    src && src.trim().length > 0 ? src : fallbackSrc

  const [imgSrc, setImgSrc] = useState(normalizedSrc)

  useEffect(() => {
    setImgSrc(normalizedSrc)
  }, [normalizedSrc])

  return (
    <img
      src={imgSrc}
      alt="Profile avatar"
      style={{ width: size, height: size }}
      className="rounded-full object-contain bg-gray-200"
      onError={() => {
        if (imgSrc !== fallbackSrc) {
          setImgSrc(fallbackSrc)
        }
      }}
    />
  )
}