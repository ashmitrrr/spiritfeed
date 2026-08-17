# Working notes for Claude Code

This file is for whichever Claude Code session picks up implementation work on SpiritFeed. Read `README.md`, `PRD.md`, `TECH_STACK.md`, `DATABASE_SCHEMA.md`, `FEATURES.md`, and `ROADMAP.md` first — this file is conventions and reminders, not the spec.

## Who this is for

One person (Ashmit) building this solo for a private friend group of 15-20 people. Optimize for "gets built and works," not for enterprise-grade robustness. It's fine to make pragmatic simplifications as long as they're noted, but don't skip auth/security basics — this app still holds real photos and personal statuses for real friends, so treat it with normal care even though the user count is tiny.

## Build order

Follow `ROADMAP.md` phase by phase. Don't jump ahead to later-phase features before earlier phases are working — each phase should leave a deployable app.

## Conventions

- TypeScript everywhere, strict mode on
- Tailwind for styling, no separate CSS-in-JS library
- Keep components small and colocated with the route that uses them unless clearly shared
- Server Components by default; mark client components explicitly only where interactivity requires it (composer, reaction taps, spirit animal picker)
- Environment variables for all Supabase keys — never commit secrets. Use `.env.local`, keep a `.env.example` up to date
- Migrations: keep schema changes as versioned SQL migration files (Supabase CLI migrations), don't hand-edit the remote schema ad hoc

## Things to double check before considering a phase "done"

- Does the feature work on a real phone screen size, not just desktop browser width? This is a mobile-first app.
- Are Supabase RLS policies actually enabled and tested for the new tables/columns touched this phase? Don't leave tables wide open.
- Does the build still deploy cleanly to Vercel?

## Things not to build unless explicitly asked

- Anything from the "explicitly deferred to v2+" list in `PRD.md`
- Public signup of any kind
- Analytics/tracking beyond what a feature explicitly needs (e.g. reaction counts)
- A generic admin panel beyond what `FEATURES.md` #10 specifies

## Open decisions to flag to Ashmit, not decide silently

- Final spirit animal roster and illustration style/source (needs actual art assets — placeholder emoji or simple SVGs are fine to build against in the meantime)
- Final emoji reaction set
- Exact color palette / visual identity beyond "minimalist and a bit nostalgic"
- Whether user removal in the admin screen is soft-delete or hard-delete

If a decision like this blocks progress, make a reasonable placeholder choice, note it clearly in the PR/commit description or a `NOTES.md`, and keep moving rather than stalling.
