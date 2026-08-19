// Spirit animal display metadata. The actual art lives in
// /public/spirit-animals/{key}.jpg (also stored authoritatively as
// spirit_animals.image_path in the DB). We keep a static key→label map so
// avatars can render anywhere (feed, header, admin) without a DB round-trip —
// image paths are deterministic from the key. No emoji anywhere anymore.

export const SPIRIT_ANIMAL_LABELS: Record<string, string> = {
  rabbit: "Rabbit",
  owl: "Owl",
  hedgehog: "Hedgehog",
  panda: "Panda",
  capybara: "Capybara",
  dolphin: "Dolphin",
  otter: "Otter",
  octopus: "Octopus",
  sheep: "Sheep",
  cat: "Cat",
  whale: "Whale",
  dog: "Dog",
  giraffe: "Giraffe",
  monkey: "Monkey",
  goat: "Goat",
}

/** Path to an animal's pixel-art portrait, or null for an unknown key. */
export function spiritAnimalImage(key: string | null | undefined): string | null {
  if (!key || !(key in SPIRIT_ANIMAL_LABELS)) return null
  return `/spirit-animals/${key}.jpg`
}

/** Human label for an animal key (e.g. "dog" → "Dog"). */
export function spiritAnimalLabel(key: string | null | undefined): string {
  if (!key) return "Spirit animal"
  return SPIRIT_ANIMAL_LABELS[key] ?? key
}

/**
 * The personality tagline shown next to a user throughout the app:
 *   "Horny Tommy the Dog"  (full)
 *   "Tommy the Dog"        (short — nickname + animal, for tight UI)
 * Degrades gracefully for profiles created before nicknames existed: falls back
 * to "Tommy the Dog", then just "Dog".
 */
export function spiritAnimalTagline(
  key: string | null | undefined,
  nickname: string | null | undefined,
  adjective: string | null | undefined,
  opts?: { short?: boolean },
): string {
  const label = spiritAnimalLabel(key)
  const name = nickname?.trim()
  const adj = adjective?.trim()
  if (!name) return label
  const core = `${name} the ${label}`
  if (opts?.short || !adj) return core
  return `${adj} ${core}`
}

/** One animal as shown in the onboarding picker. */
export type AnimalOption = {
  key: string
  label: string
  /** Portrait path (from the DB's image_path). */
  imagePath: string | null
  /** 1–2 sentence trait description shown on the personality reveal. */
  personalityBlurb: string | null
  /** Display name of whoever already has this animal, or null if available. */
  takenByName: string | null
}
