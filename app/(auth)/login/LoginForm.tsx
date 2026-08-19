"use client"

import { useActionState } from "react"

import { loginAction, type LoginState } from "./actions"

const INITIAL_STATE: LoginState = { error: null }

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Username</span>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="pixel-input px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="pixel-input px-3 py-2 text-sm"
        />
      </label>

      {state.error && (
        <p className="pixel-alert px-3 py-2 text-sm">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="pixel-btn pixel-btn-primary w-full px-4 py-2.5 text-sm"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
