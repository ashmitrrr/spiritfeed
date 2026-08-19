"use client"

import Image from "next/image"
import { useActionState, useState } from "react"

import {
  ANIMAL_ADJECTIVE_MAX,
  ANIMAL_NICKNAME_MAX,
} from "@/lib/auth/credentials"
import {
  spiritAnimalImage,
  spiritAnimalLabel,
  spiritAnimalTagline,
} from "@/lib/spirit-animals"
import { AnimalPicker, type AnimalOption } from "./AnimalPicker"

export type OnboardingState = { error: string | null }

export const ONBOARDING_INITIAL_STATE: OnboardingState = { error: null }

type OnboardingAction = (
  prevState: OnboardingState,
  formData: FormData,
) => Promise<OnboardingState>

type Props = {
  action: OnboardingAction
  animals: AnimalOption[]
  submitLabel?: string
  /** Extra hidden inputs submitted with the form (e.g. the invite token). */
  hiddenFields?: Record<string, string>
}

// The onboarding wizard steps, in order.
type Step = "form" | "reveal" | "name" | "adjective" | "final"

/** Square animal portrait used in the reveal / final cards. */
function AnimalPortrait({
  animalKey,
  imagePath,
  label,
}: {
  animalKey: string
  imagePath: string | null
  label: string
}) {
  const src = imagePath ?? spiritAnimalImage(animalKey)
  return (
    <div className="relative mx-auto h-28 w-28 overflow-hidden border-2 border-ink bg-bone-dim">
      {src && (
        <Image src={src} alt={label} fill sizes="112px" className="object-cover" />
      )}
    </div>
  )
}

export function OnboardingForm({
  action,
  animals,
  submitLabel = "Create account",
  hiddenFields,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    action,
    ONBOARDING_INITIAL_STATE,
  )
  const [step, setStep] = useState<Step>("form")
  const [selected, setSelected] = useState<string | null>(null)
  const [nickname, setNickname] = useState("")
  const [adjective, setAdjective] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const selectedAnimal = animals.find((a) => a.key === selected) ?? null
  const animalLabel = spiritAnimalLabel(selected)

  // Step 1 → reveal: run native validation on username/password, require a pick.
  function goToReveal() {
    setLocalError(null)
    const form = document.getElementById(
      "onboarding-form",
    ) as HTMLFormElement | null
    if (form && !form.reportValidity()) return
    if (!selected) {
      setLocalError("Pick a spirit animal first.")
      return
    }
    setStep("reveal")
  }

  function goToAdjective() {
    setLocalError(null)
    const name = nickname.trim()
    if (!name) {
      setLocalError("Give your animal a name.")
      return
    }
    setStep("adjective")
  }

  function goToFinal() {
    setLocalError(null)
    if (!adjective.trim()) {
      setLocalError("Choose an adjective for your animal.")
      return
    }
    setStep("final")
  }

  // Server-side errors clear the local one; show whichever is present.
  const error = state.error ?? localError

  return (
    <form id="onboarding-form" action={formAction} className="space-y-5">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      {/* Values submitted with the form. The credential inputs stay mounted
          (just hidden after step 1) so their values persist; the animal
          fields are mirrored from state into these hidden inputs. */}
      <input type="hidden" name="animalKey" value={selected ?? ""} />
      <input type="hidden" name="animalNickname" value={nickname} />
      <input type="hidden" name="animalAdjective" value={adjective} />

      {/* ── Step 1: credentials + animal grid ─────────────────────────── */}
      <div hidden={step !== "form"} className="space-y-5">
        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Username</span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]+"
              placeholder="e.g. ash"
              className="pixel-input px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="at least 8 characters"
              className="pixel-input px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Pick your spirit animal</span>
            <span className="text-xs uppercase tracking-wide text-ink/50">
              permanent
            </span>
          </div>
          <AnimalPicker
            options={animals}
            value={selected}
            onChange={(key) => {
              setSelected(key)
              setLocalError(null)
            }}
          />
        </div>

        <button
          type="button"
          onClick={goToReveal}
          className="pixel-btn pixel-btn-primary w-full px-4 py-2.5 text-sm"
        >
          Continue
        </button>
      </div>

      {/* ── Step 2: personality reveal ────────────────────────────────── */}
      {step === "reveal" && selectedAnimal && (
        <div className="space-y-4 border-2 border-ink bg-white p-4 text-center">
          <AnimalPortrait
            animalKey={selectedAnimal.key}
            imagePath={selectedAnimal.imagePath}
            label={animalLabel}
          />
          <p className="text-sm">
            You&apos;ve chosen the <strong>{animalLabel}</strong> to be your
            spirit.
          </p>
          {selectedAnimal.personalityBlurb && (
            <p className="text-sm text-ink/70">
              {selectedAnimal.personalityBlurb}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                setStep("form")
              }}
              className="pixel-btn pixel-btn-secondary flex-1 px-4 py-2 text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                setStep("name")
              }}
              className="pixel-btn pixel-btn-primary flex-1 px-4 py-2 text-xs"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: name your animal ──────────────────────────────────── */}
      {step === "name" && (
        <div className="space-y-4 border-2 border-ink bg-white p-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" htmlFor="animal-name">
              Name your animal
            </label>
            <input
              id="animal-name"
              type="text"
              value={nickname}
              autoFocus
              maxLength={ANIMAL_NICKNAME_MAX}
              placeholder="e.g. Tommy"
              onChange={(e) => {
                setNickname(e.target.value)
                setLocalError(null)
              }}
              className="pixel-input px-3 py-2 text-sm"
            />
            <p className="text-right text-xs text-ink/40">
              {nickname.length}/{ANIMAL_NICKNAME_MAX}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                setStep("reveal")
              }}
              className="pixel-btn pixel-btn-secondary flex-1 px-4 py-2 text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goToAdjective}
              className="pixel-btn pixel-btn-primary flex-1 px-4 py-2 text-xs"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: choose an adjective ───────────────────────────────── */}
      {step === "adjective" && (
        <div className="space-y-4 border-2 border-ink bg-white p-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" htmlFor="animal-adj">
              Choose an adjective for your animal
            </label>
            <input
              id="animal-adj"
              type="text"
              value={adjective}
              autoFocus
              maxLength={ANIMAL_ADJECTIVE_MAX}
              placeholder="e.g. Sleepy"
              onChange={(e) => {
                setAdjective(e.target.value)
                setLocalError(null)
              }}
              className="pixel-input px-3 py-2 text-sm"
            />
            <p className="text-right text-xs text-ink/40">
              {adjective.length}/{ANIMAL_ADJECTIVE_MAX}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                setStep("name")
              }}
              className="pixel-btn pixel-btn-secondary flex-1 px-4 py-2 text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goToFinal}
              className="pixel-btn pixel-btn-primary flex-1 px-4 py-2 text-xs"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: final tagline reveal + submit ─────────────────────── */}
      {step === "final" && selectedAnimal && (
        <div className="space-y-4 border-2 border-ink bg-bone p-4 text-center">
          <AnimalPortrait
            animalKey={selectedAnimal.key}
            imagePath={selectedAnimal.imagePath}
            label={animalLabel}
          />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-ink/50">
              Say hello to
            </p>
            <p className="font-display text-lg leading-tight text-olive-dark">
              {spiritAnimalTagline(selected, nickname, adjective)}
            </p>
          </div>
          <p className="text-xs text-ink/60">
            Your spirit animal is <strong>forever</strong>.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                setStep("adjective")
              }}
              disabled={isPending}
              className="pixel-btn pixel-btn-secondary flex-1 px-4 py-2 text-xs"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="pixel-btn pixel-btn-primary flex-1 px-4 py-2 text-xs"
            >
              {isPending ? "Creating…" : submitLabel}
            </button>
          </div>
        </div>
      )}

      {error && <p className="pixel-alert px-3 py-2 text-sm">{error}</p>}
    </form>
  )
}
