# Implementation Notes

Running log of pragmatic decisions, placeholders, and things to flag to Ashmit.
Newest phase at the top.

## Pre-deploy — storage cleanup, admin delete-user, @mentions (done)

**1. Storage cleanup (one-off)**: removed the 2 orphaned photo objects left by
deleted test accounts via a throwaway service-role script; confirmed the
`photos` bucket is now **empty**. Script was run then deleted — no permanent
tooling added.

**2. Admin "Remove user"** (`lib/auth/admin-users.ts` `deleteUserCompletely`,
`removeUserAction` in `app/admin/actions.ts`, `RemoveUserButton.tsx`, Members
section on the admin page). Built against the **verified live FK behavior**, not
assumptions:
- `profiles.id → auth.users` is CASCADE, so `deleteUser()` removes the profile.
  `posts/reactions/statuses/streaks → profiles` are CASCADE too.
- **`spirit_animals.taken_by → profiles` is NO ACTION, NOT set-null** — so the
  animal is freed explicitly (else the delete fails and the animal stays locked).
- Other NO ACTION referrers that would block the profile delete are cleared
  first: `invites.created_by`/`used_by` (deleted — created_by is NOT NULL so
  can't null it), `setup_lock.claimed_by` (nulled, **never** delete the row or
  /setup re-opens), `weekly_recaps.most_active_user_id`/`top_post_id` (nulled).
- Post photos are removed from storage before the rows go.
- **Guards**: admin-only; can't remove your own account (friendly message; own
  row shows "You" instead of a button). **Type-to-confirm** UI (must type the
  exact username) — no single-click deletes.
- **Verified end-to-end** against the live project: a throwaway fully-wired user
  (animal claim, invites created+used by them, post+photo, reaction, status,
  streak) was torn down — 10/10 checks pass (deleteUser no FK block, profile
  cascaded, animal freed, photos/invites gone, counts back to baseline). Test
  user created + cleaned up; no real data touched. (Baseline is currently 0
  profiles — the earlier test accounts have since been cleared.)

**3. @mentions** (`lib/mentions.ts` pure parser + `lib/mentions-server.ts`
`getMentionableUsers`, `MentionInput.tsx`, `RichText.tsx`, `.pixel-tag` in
globals). Composer caption + status now use `MentionInput`: typing `@` opens a
lightweight dropdown filtered client-side over the full (~15-20) user list
(fetched server-side in `page.tsx`, authenticated client); pick with
click/Enter/Tab, arrow-key nav, Esc to dismiss — inserts `@username `. In the
feed, `RichText` renders `@username` patterns as pixel tags (visual only — no
links, no notifications, none exists yet). `CAPTION_MAX` (280) / `STATUS_MAX`
(100) unchanged; the `@username` text counts toward the cap like any character
(enforced by `maxLength` + a manual cap on programmatic insertion).

**Verified**: `npm run lint` + `npm run build` clean. **Ready for Vercel** once
reviewed — remember to set `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY`
in the Vercel project env.

## Phase — Spirit animal personality system (done)

Replaced emoji spirit-animals with real pixel-art portraits and added a
personality/naming step to onboarding.

**Assets**: copied+renamed 15 files from `public/animals_bg/` into
`public/spirit-animals/{key}.jpg` (rabbit, owl, hedgehog, panda, capybara,
dolphin, otter, octopus, sheep, cat, whale, dog, giraffe, monkey, goat).
Originals left in place — still used by the auth collage background.

**Avatars everywhere → real images** (`next/image`): `lib/spirit-animals.ts`
rewritten — dropped `SPIRIT_ANIMAL_EMOJI`/`spiritAnimalEmoji`, added
`SPIRIT_ANIMAL_LABELS`, `spiritAnimalImage(key)` (deterministic
`/spirit-animals/{key}.jpg`), `spiritAnimalLabel(key)`, and
`spiritAnimalTagline(key, nickname, adjective, {short})`. `Avatar`,
`AnimalPicker`, `PostCard`, feed header (`page.tsx`), and admin now render
portraits. Verified static key set (15) exactly matches the DB keys + labels and
`image_path` values; `next/image` optimizer serves them (no config needed for
`/public`).

**New onboarding flow** (`OnboardingForm.tsx`, both `/setup` + `/join`) — a
5-step wizard: (1) username/password + animal grid, (2) personality reveal
("You've chosen the [Animal] to be your spirit." + `personality_blurb`),
(3) name your animal, (4) choose an adjective, (5) final tagline reveal
("[Adjective] [Nickname] the [Animal]") → submit. Implemented as one `<form>`:
credential inputs stay mounted (hidden after step 1, so they still submit but are
barred from constraint validation); animal key/nickname/adjective are mirrored
from React state into hidden inputs. **Atomic animal-claim logic in
`onboarding.ts` is unchanged** — just added `animalNickname`/`animalAdjective`
params, validation, and two columns on the profile insert.

**Persistence + display**: `profiles.animal_nickname` / `animal_adjective` saved
on signup (both required, capped 24 chars via
`validateAnimalPersona` in `credentials.ts`, no profanity filter per Ashmit).
Tagline shown next to the avatar in the feed header (short form: "Tommy the
Dog"), each post card (full form), and the admin members list.

**Graceful fallback**: 3 profiles already existed before these columns
(octopus/owl/panda holders) with null nickname/adjective — `spiritAnimalTagline`
degrades to "the [Animal]" → just "[Animal]", so nothing breaks for them.

**No more emoji for animals** — removed the last decorative emoji (🐾 on the
invalid-invite page). ⚠️ **Interpretation to confirm**: I kept the emoji
*reaction* set (🔥❤️😂👀😮) since that's the reactions feature from Phase 2, not
an animal placeholder. If "no emojis anywhere" was meant to include reactions
too, say so and I'll swap them for something else.

**Verified**: `npm run lint` + `npm run build` clean; dev smoke test — `/login`
200, `/spirit-animals/dog.jpg` 200, `next/image` optimize 200, `/setup` correctly
307-redirects (profiles exist). DB confirmed: 15 animals, all with `image_path` +
`personality_blurb`.

## Phase 3.5 — Visual design pass (done)

Styling-only pass per `DESIGN.md`. **No new features, no schema/RLS/Server Action
logic touched** — purely presentational.

**Design tokens** (`app/globals.css`): palette as CSS vars + Tailwind theme
tokens — `--olive #8b8c63`, `--olive-dark #6f7049`, `--bone #ece6d5`,
`--bone-dim`, `--ink #322e27` (borders/shadows/text), `--white`, `--error`. Page
background = bone, text = ink. **`border-radius: 0` set globally** (base-layer
`* { border-radius: 0 }`) — removes Tailwind's default rounding app-wide;
avatars/cards/inputs/buttons are all hard-square now.

**Typography** (`app/layout.tsx`, `next/font/google`): **Silkscreen** for
headers/logo/buttons (`.font-display`, `h1/h2/h3`, `.pixel-btn`); **Pixelify
Sans** for body copy + form inputs (default `body` font, `.pixel-input`).

**UI style** — reusable component classes in `globals.css`: `.pixel-panel`
(white, 3px ink border, `4px 4px 0` hard shadow), `.pixel-card` (bone auth card,
deeper `6px 6px 0` shadow), `.pixel-input` (2px border, olive focus), `.pixel-btn`
+ `-primary`/`-secondary` (chunky border + hard shadow, **pressed state = 3px
offset shift, no opacity fade**), `.pixel-chip` (tabs/reactions, olive fill when
`aria-pressed`/`data-active`), `.pixel-alert`. Replaced every hairline
`border-foreground/10` + `rounded-*` + `dark:` style across the feed, composer,
reactions, post cards, onboarding, login, admin.

**Auth collage** (`app/(auth)/_components/CollageBackground.tsx` + auth
`layout.tsx`): full-bleed tiled grid of the pixel-animal portraits in
`public/animals_bg/` under a semi-opaque olive wash (`bg-olive/80`), with the
bone `.pixel-card` centered on top (Canva sign-in structure). Applies to
`/login`, `/join/[token]`, `/setup`. **Excluded 2 of the 19 images**: the
watermarked donkey (`879609370971139963.jpeg`, has a 小红书 stamp) and the
low-res `Octopus.jpeg` — 17 images used, tiled ×3 to fill large viewports.
Special-char filenames (spaces, Cyrillic) are `encodeURIComponent`-ed; verified
all 17 resolve.

**Spirit-animal avatars**: left as the current emoji placeholders per Ashmit —
no real pixel-art avatar set yet.

**Verified**: `npm run lint` + `npm run build` clean; dev smoke test — `/login`
200, collage `<img>`s present and served (200), `.pixel-card` renders.

**⚠️ Flag for Ashmit**: the olive hex (`#8b8c63`) is a best-guess sampled from
the pasted logo *screenshot*, not the real logo file. If it reads off once you
see it applied, send the actual logo (SVG/PNG) and I'll resample `--olive` /
`--olive-dark` (and can derive `--bone`/`--ink` from it too). Also still open
from earlier phases: real pixel-art avatars (needs a curated one-per-animal set)
and final reaction-emoji set.

## Phase 2 — Core posting & feed (done)

The MVP core loop: post a photo, post a status, see the feed, react with emoji.
Styling deliberately plain (design pass comes later).

**Composer** (`app/_components/Composer.tsx`, inline at top of feed — simpler and
more reliable than a modal for MVP): Photo/Status tabs.
- Photo: file input (`accept="image/*"`, opens camera on mobile), preview,
  optional caption. Compresses **client-side** (`lib/image.ts`, canvas →
  downscale to 1600px max edge → JPEG q0.8) before upload.
- Status: textarea, max 100 chars with counter.

**Post creation** (`app/_actions/posts.ts`, service-role): photo posts upload the
compressed blob to the private `photos` bucket at `{user_id}/{post_id}.{ext}`,
then insert the `posts` row; on insert failure the orphaned upload is removed.
Status posts insert `post_type='status'` with the text in `caption`. Both
`revalidatePath('/')`.

**Feed** (`lib/posts.ts` + `app/page.tsx`, `force-dynamic`): reverse-chron, reads
posts + embedded author + reactions with the authenticated client (RLS allows),
generates signed photo URLs (1h TTL) with the service-role client. Already
filters out locked time capsules (`is_time_capsule=false OR unlock_at<=now`) so
Phase 5 needs no feed change. Reaction tallies + which emojis the current user
used are computed per post.

**Reactions** (`app/_actions/reactions.ts` + `ReactionBar.tsx`): fixed set
🔥❤️😂😮👀, tap to toggle, optimistic client update with revert on failure. Toggle
uses the **authenticated** client so RLS enforces `user_id = auth.uid()` (a
spoofed user_id is rejected — verified). No feed revalidation per tap (snappy).

**Edge cases handled**: empty feed state; "Photo unavailable" placeholder when a
signed URL can't be produced; oversized originals rejected client-side (25 MB)
and compressed output capped server-side (8 MB); HEIC/undecodable images fall
back to uploading the original if within cap, else a friendly error; empty
status/caption length caps (status 100, caption 280).

**Verified**: build + lint clean; a live integration test against the real
project (throwaway 3rd user, cleaned up fully) passed all 16 checks — private
bucket upload, signed-URL fetch returns bytes, feed embedded-author join + or-
filter, reaction insert/toggle-delete, unique-constraint dedupe (23505), and RLS
blocking a spoofed reaction (42501). Left the 2 existing accounts untouched; DB +
storage restored to pre-test state.

**Not done this phase (by roadmap)**: status posts do NOT yet upsert the
`statuses` table — that's Phase 3 (mood dashboard) along with showing spirit
animals on a dedicated screen. Streak updates on post = Phase 4. Time capsule
composer toggle = Phase 5. `next/image` intentionally skipped in favor of plain
`<img>` for expiring signed URLs (with eslint-disable) — fine for MVP.

**Open (unchanged)**: final reaction emoji set is a taste call; current set is a
placeholder.

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
