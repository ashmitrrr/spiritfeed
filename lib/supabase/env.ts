// Centralized access to the public Supabase env vars so a missing value fails
// loudly and in one place rather than as a confusing runtime error deep in the
// client. Both of these are public (safe to expose to the browser) — the anon /
// publishable key only grants what RLS allows.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  return value
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
)

// Prefer the newer publishable key name, fall back to the classic anon key.
export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)
