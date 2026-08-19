"use client"

import { spiritAnimalEmoji, type AnimalOption } from "@/lib/spirit-animals"

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
              "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border p-1 text-center transition",
              taken
                ? "cursor-not-allowed border-transparent bg-foreground/[0.03] opacity-40"
                : "cursor-pointer border-foreground/10 hover:border-foreground/30",
              selected
                ? "border-foreground/60 bg-foreground/[0.06] ring-2 ring-foreground/40"
                : "",
            ].join(" ")}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {spiritAnimalEmoji(animal.key)}
            </span>
            <span className="w-full truncate text-[10px] leading-tight text-foreground/60">
              {taken ? animal.takenByName : animal.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
