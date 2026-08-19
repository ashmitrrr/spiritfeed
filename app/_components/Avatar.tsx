import Image from "next/image"

import { spiritAnimalImage, spiritAnimalLabel } from "@/lib/spirit-animals"
import { PixelCrown } from "./PixelCrown"

const SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const

const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 56,
} as const

const CROWN_W = {
  sm: "w-4",
  md: "w-5",
  lg: "w-7",
} as const

export function Avatar({
  animalKey,
  size = "md",
  crowned = false,
}: {
  animalKey: string
  size?: keyof typeof SIZES
  /** Renders the spirit-crown badge over the avatar. */
  crowned?: boolean
}) {
  const src = spiritAnimalImage(animalKey)
  return (
    // Outer wrapper is NOT clipped so the crown can overflow the top edge.
    <span className={`relative inline-block shrink-0 ${SIZES[size]}`}>
      <span className="absolute inset-0 overflow-hidden border-2 border-ink bg-bone-dim">
        {src && (
          <Image
            src={src}
            alt={spiritAnimalLabel(animalKey)}
            fill
            sizes={`${SIZE_PX[size]}px`}
            className="object-cover"
          />
        )}
      </span>
      {crowned && (
        <PixelCrown
          className={`absolute -top-2 left-1/2 -translate-x-1/2 ${CROWN_W[size]} drop-shadow-[1px_1px_0_rgba(50,46,39,0.4)]`}
        />
      )}
    </span>
  )
}
