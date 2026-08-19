import Image from "next/image"

import { spiritAnimalImage, spiritAnimalLabel } from "@/lib/spirit-animals"

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

export function Avatar({
  animalKey,
  size = "md",
}: {
  animalKey: string
  size?: keyof typeof SIZES
}) {
  const src = spiritAnimalImage(animalKey)
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden border-2 border-ink bg-bone-dim ${SIZES[size]}`}
    >
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
  )
}
