import { spiritAnimalEmoji } from "@/lib/spirit-animals"

const SIZES = {
  sm: "h-8 w-8 text-lg",
  md: "h-10 w-10 text-2xl",
  lg: "h-12 w-12 text-3xl",
} as const

export function Avatar({
  animalKey,
  size = "md",
}: {
  animalKey: string
  size?: keyof typeof SIZES
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] ${SIZES[size]}`}
      aria-hidden
    >
      {spiritAnimalEmoji(animalKey)}
    </span>
  )
}
