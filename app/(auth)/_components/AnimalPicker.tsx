"use client"

import Image from "next/image"

import { spiritAnimalImage, type AnimalOption } from "@/lib/spirit-animals"

export type { AnimalOption }

type Props = {
  options: AnimalOption[]
  value: string | null
  onChange: (key: string) => void
}

export function AnimalPicker({ options, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {options.map((animal) => {
        const taken = animal.takenByName !== null
        const selected = value === animal.key
        const src = animal.imagePath ?? spiritAnimalImage(animal.key)
        return (
          <button
            key={animal.key}
            type="button"
            disabled={taken}
            aria-pressed={selected}
            onClick={() => onChange(animal.key)}
            title={
              taken ? `${animal.label} — ${animal.takenByName}` : animal.label
            }
            className={[
              "flex aspect-square flex-col items-center justify-end overflow-hidden border-2 text-center",
              taken
                ? "cursor-not-allowed border-ink/20 opacity-45"
                : "cursor-pointer border-ink active:translate-x-px active:translate-y-px",
              selected ? "border-olive pixel-shadow-sm" : "",
            ].join(" ")}
          >
            <span className="relative w-full flex-1 overflow-hidden bg-bone-dim">
              {src && (
                <Image
                  src={src}
                  alt={animal.label}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </span>
            <span
              className={[
                "w-full truncate border-t-2 px-0.5 py-0.5 text-[10px] leading-tight",
                selected
                  ? "border-olive bg-olive text-white"
                  : "border-ink bg-white text-ink/80",
                taken ? "border-ink/20" : "",
              ].join(" ")}
            >
              {taken ? animal.takenByName : animal.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
