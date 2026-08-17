# Build Roadmap

Suggested build order. Each phase should leave the app in a working, deployable state — don't move to the next phase with a broken build.

## Phase 0 — Project setup

- Scaffold Next.js (App Router, TypeScript, Tailwind) with `create-next-app`
- Create the Supabase project, connect via env vars
- Apply the initial schema from `DATABASE_SCHEMA.md` as a migration
- Deploy an empty shell to Vercel to confirm the pipeline works end to end
- Seed the `spirit_animals` table with the initial animal set + illustration assets

## Phase 1 — Auth & onboarding

- Invite generation (admin-only, can be a basic authenticated route for now, doesn't need polish yet)
- `/join/[token]` flow: token validation → username/password → spirit animal picker → account creation
- `/login`
- Auth-gated layout: everything except `/join` and `/login` requires a session

## Phase 2 — Core posting & feed

- Post composer (photo + status modes, no time capsule yet)
- Photo upload to Supabase Storage with client-side compression
- Feed screen rendering posts in reverse chronological order
- Basic reaction bar (toggle emoji, persist to `reactions`)

## Phase 3 — Identity & mood

- Spirit animal avatar shown consistently everywhere posts/users appear
- Mood dashboard screen (`/mood`)
- Status posts wired to update the `statuses` table alongside `posts`

## Phase 4 — Streaks

- Streak calculation logic (on post/status creation, update `streaks`)
- Group streak view + per-user heatmap screen

## Phase 5 — Time capsules

- Composer toggle for time capsule + unlock date picker
- Feed query updated to exclude locked capsules
- Visual tag for unlocked capsule posts in the feed

## Phase 6 — Weekly recap

- Scheduled job (Vercel Cron hitting an API route, or Supabase Edge Function on a schedule) to generate the weekly recap
- `/recap` screen reading the latest generated recap
- Backfill/test by manually triggering the job before relying on the schedule

## Phase 7 — PWA polish

- Manifest, icons, splash screens
- Service worker for offline app-shell caching
- Test "Add to Home Screen" on both iOS and Android
- Push notification setup if pursuing it (optional for v1, needed if daily-prompt nudges get added later)

## Phase 8 — Ship to the group

- Generate invite links for all 15-20 friends
- Send them out, watch for onboarding friction, fix fast
- Treat the first week of real usage as the actual test of whether the fun features land

## After v1

Revisit the deferred features list in `PRD.md` based on what the group actually asks for once they're using it. Don't build v2 features speculatively — this app's advantage is being small and responsive to what this specific group wants.
