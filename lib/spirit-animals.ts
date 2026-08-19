// Emoji placeholders for spirit animals, keyed by the `spirit_animals.key`
// values seeded in the database. Real illustrated art assets will replace these
// later (the DB's icon_url points at /animals/{key}.svg for that future swap);
// until then the whole app renders animals via spiritAnimalEmoji().
//
// A few animals have no dedicated Unicode emoji (capybara, meerkat, narwhal,
// platypus, red panda, hummingbird, lynx) — those use the closest visual
// stand-in. Fine for placeholders.

export const SPIRIT_ANIMAL_EMOJI: Record<string, string> = {
  axolotl: "🦎",
  badger: "🦡",
  bear: "🐻",
  capybara: "🦫",
  crow: "🐦‍⬛",
  deer: "🦌",
  dolphin: "🐬",
  flamingo: "🦩",
  fox: "🦊",
  hedgehog: "🦔",
  hummingbird: "🐦",
  koala: "🐨",
  lynx: "🐆",
  meerkat: "🐿️",
  narwhal: "🐋",
  octopus: "🐙",
  otter: "🦦",
  owl: "🦉",
  panda: "🐼",
  penguin: "🐧",
  platypus: "🦆",
  rabbit: "🐰",
  raccoon: "🦝",
  red_panda: "🐈",
  sloth: "🦥",
  tiger: "🐯",
  turtle: "🐢",
  wolf: "🐺",
}

const FALLBACK_EMOJI = "🐾"

export function spiritAnimalEmoji(key: string | null | undefined): string {
  if (!key) return FALLBACK_EMOJI
  return SPIRIT_ANIMAL_EMOJI[key] ?? FALLBACK_EMOJI
}

/** One animal as shown in the onboarding picker. */
export type AnimalOption = {
  key: string
  label: string
  /** Display name of whoever already has this animal, or null if available. */
  takenByName: string | null
}
