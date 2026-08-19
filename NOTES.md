# Implementation Notes

Running log of pragmatic decisions, placeholders, and things to flag to Ashmit.
Newest phase at the top.

## Phase 1 — Auth & onboarding (done)

**Auth model**: invite-only username/password on top of Supabase Auth. Usernames
map to synthetic, non-routable emails `<username>@spiritfeed.local` (never
emailed). Verified live that Supabase accepts these + password sign-in works.
Usernames: lowercase `[a-z0-9_]`, 3–20 chars, case-insensitive for login.
`display_name` keeps the original casing the user typed. Password min 8.

**Service-role usage**: RLS forbids the anon key from the onboarding writes, so
all privileged steps run server-side via `lib/supabase/admin.ts` (guarded by
`server-only`). `lib/auth/onboarding.ts#createAccount()` does the whole flow
(validate → create auth user → insert profile → atomically claim animal → mark
invite used) with best-effort rollback/cleanup if a later step fails. Animal
claim + invite-use are conditional updates (`.is(..., null)`) so a race can't
double-assign — negligible at this scale but correct.

**Bootstrap `/setup`**: solves the chicken-and-egg problem (invites.created_by
is NOT NULL → profiles.id, so the first admin can't come via an invite). It
creates the first account as `is_admin = true` with no invite, and **only works
while the profiles table is empty** — it redirects to /login once any profile
exists, so it disables itself after first use. Forced `dynamic = "force-dynamic"`
so the emptiness check isn't statically cached. **➡️ Ashmit: run `/setup` first
to claim your admin account + spirit animal.**

**Routes added**: `/setup`, `/login`, `/join/[token]` (all under an `(auth)`
route group with a shared centered layout), `/admin` (invite gen + list,
admin-only), `POST /auth/signout`, and `/` rewritten as the authed home shell.

**Auth gating** lives in `proxy.ts` → `lib/supabase/middleware.ts`: no session +
private path → `/login`; session + guest-only path (`/login`,`/join`,`/setup`) →
`/`. Public paths are the auth screens + `/auth/*`.

**Spirit animals**: 28 seeded; built against **emoji placeholders**
(`lib/spirit-animals.ts`, keyed by animal `key`) per Ashmit's call — real art
(`icon_url` → `/animals/{key}.svg`) swaps in later. A few animals (capybara,
meerkat, narwhal, platypus, red panda, hummingbird, lynx) use approximate emoji.
The picker grays out taken animals with the current holder's name and requires a
"this is forever" confirm step before submit.

**Verified**: `npm run build` + `npm run lint` clean; live GET smoke tests pass
(`/`→redirect `/login`, `/login`, `/setup` renders form+grid, `/join/<bad>` shows
friendly invalid message, `/admin`→redirect when signed out); synthetic-email
create/sign-in/delete verified against the real project and cleaned up. DB left
pristine (0 users / 0 profiles / 0 animals taken / 0 invites).

**Deferred / notes for later**:
- No "forgot password" flow (by design — reset via Supabase dashboard).
- Spirit-animal immutability is enforced in app logic only (no DB trigger yet),
  matching DATABASE_SCHEMA.md's "belt-and-suspenders later" note.
- `/admin` is intentionally basic (Phase 1 scope); no expiry set on generated
  invites yet (expires_at left null = never expires). Easy to add later.
- Invite links are shown as absolute URLs built from request headers; when
  deployed, they'll use the Vercel host automatically.

## Phase 0 — Project setup (done)

**Stack as scaffolded**

- Next.js **16.3.1** (App Router, Turbopack), React 19.2, TypeScript strict,
  Tailwind **v4**, ESLint 9. `create-next-app` picked these latest versions —
  note the docs say "Next 14+", so we're comfortably above the floor.
- Next 16 renamed the `middleware.ts` convention to **`proxy.ts`** (exports a
  `proxy` function). We use `proxy.ts` → `lib/supabase/middleware.ts`'s
  `updateSession()` to refresh the Supabase auth session on every request.
  It does **not** gate/redirect routes yet — route protection lands in Phase 1
  once `/login` and `/join` exist. For now it just keeps tokens fresh.

**Supabase wiring**

- Clients live in `lib/supabase/`: `client.ts` (browser), `server.ts`
  (Server Components / Actions / Route Handlers), `middleware.ts` (session
  refresh). Env access is centralized in `lib/supabase/env.ts` so a missing key
  fails loudly.
- DB types generated from the live schema into `lib/database.types.ts`. If the
  schema changes, regenerate them.
- `.env.example` added. `.env.local` already had `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `app/page.tsx` is a placeholder landing shell that also live-checks the
  Supabase connection (counts available spirit animals). It gets replaced by
  auth (Phase 1) then the feed (Phase 2).

**Schema confirmed**: all 8 tables exist (`invites, posts, profiles, reactions,
spirit_animals, statuses, streaks, weekly_recaps`), and `spirit_animals` is
already seeded with **28** animals. Icons: check `spirit_animals.icon_url`
values before Phase 1 — need to confirm whether real art assets exist or if we
build against emoji/SVG placeholders (an open decision in CLAUDE.md).

### ⚠️ Flag for Ashmit — needed before/during Phase 1

The RLS policies are all scoped to the **`authenticated`** role only, with these
gaps that block the onboarding flow as designed:

1. **`spirit_animals` is not readable anonymously.** The `/join/[token]` spirit
   animal picker needs to show the roster *before* the user has an account.
2. **`invites` has no RLS policies at all** — so token validation (read) and
   admin invite generation (insert) can't happen with the anon key.
3. **`profiles` has no INSERT policy** — a new user can't create their own
   profile row with the anon key at onboarding.
4. **`spirit_animals` has no UPDATE policy** — can't set `taken_by` at pick time.

The clean fix is to do these privileged onboarding steps **server-side with the
Supabase `service_role` key** (validate token, create auth user, insert profile,
mark animal `taken_by`, mark invite used) inside a Route Handler / Server Action.
That key must be added to `.env.local` as a **non-`NEXT_PUBLIC`** var (e.g.
`SUPABASE_SERVICE_ROLE_KEY`) and never shipped to the browser.

**Decision needed:** add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (preferred,
standard Supabase admin pattern), **or** relax RLS to allow anon reads on
`spirit_animals`/`invites` and add the missing policies. I'll assume the
service-role approach for Phase 1 unless told otherwise.

**Vercel deploy**: not yet run from this session (no Vercel CLI auth here). Build
passes locally (`npm run build`) and is Vercel-ready. When deploying, set the
`NEXT_PUBLIC_SUPABASE_*` env vars (and later `SUPABASE_SERVICE_ROLE_KEY`) in the
Vercel project settings.
