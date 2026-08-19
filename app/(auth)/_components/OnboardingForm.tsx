"use client"

import { useActionState, useState } from "react"

import { spiritAnimalEmoji } from "@/lib/spirit-animals"
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
  const [selected, setSelected] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const selectedAnimal = animals.find((a) => a.key === selected) ?? null

  function handleContinue() {
    setLocalError(null)
    const form = document.getElementById(
      "onboarding-form",
    ) as HTMLFormElement | null
    if (form && !form.reportValidity()) return
    if (!selected) {
      setLocalError("Pick a spirit animal first.")
      return
    }
    setConfirming(true)
  }

  const error = state.error ?? localError

  return (
    <form id="onboarding-form" action={formAction} className="space-y-5">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className="space-y-3">
        <label className="block space-y-1">
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
            placeholder="e.g. priya"
            className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="at least 8 characters"
            className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Pick your spirit animal</span>
          <span className="text-xs text-foreground/40">permanent</span>
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

      {/* Hidden field carries the picked animal into the server action */}
      <input type="hidden" name="animalKey" value={selected ?? ""} />

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!confirming ? (
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          {submitLabel}
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-foreground/15 bg-foreground/[0.03] p-4 text-center">
          <p className="text-sm">
            Your spirit animal is <strong>forever</strong>. You picked:
          </p>
          <p className="text-3xl" aria-hidden>
            {selectedAnimal ? spiritAnimalEmoji(selectedAnimal.key) : "🐾"}
          </p>
          <p className="text-sm font-medium">{selectedAnimal?.label}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="flex-1 rounded-lg border border-foreground/20 px-4 py-2 text-sm transition hover:bg-foreground/5 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Creating…" : `Yes — ${selectedAnimal?.label} forever`}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
