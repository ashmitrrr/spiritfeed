# Tech Stack

## Summary

Next.js (App Router) + Supabase, deployed on Vercel, built as an installable PWA. Chosen for solo-developer speed, near-zero cost at 15-20 users, and because Claude Code can scaffold and iterate on this stack quickly and reliably.

## Frontend

- **Next.js 14+ (App Router, TypeScript)** — one codebase for UI, API routes, and server logic. Huge ecosystem, well-understood by Claude Code.
- **Tailwind CSS** — fast to build a distinct, minimalist visual style without fighting a component library.
- **next-pwa** (or the built-in App Router PWA approach with a manual manifest + service worker) — makes the site installable on iOS/Android home screens with an app icon, splash screen, and offline shell caching.
- **React Server Components** where practical, client components for interactive bits (post composer, reaction picker, spirit animal grid).

## Backend / data

- **Supabase** (Postgres + Auth + Storage), single project:
  - **Postgres** for all relational data (users, posts, reactions, statuses, streaks, time capsules)
  - **Supabase Auth** — but since login is invite-link + username/password rather than email-based public signup, we use Supabase Auth's email/password provider with synthetic emails (e.g. `username@spiritfeed.local`) generated at signup, OR self-manage a lightweight custom auth table. Recommendation: use Supabase Auth with synthetic emails — far less work than hand-rolling password hashing/session management, and still fully gated (no public signup UI, accounts only get created via a valid invite token).
  - **Supabase Storage** for photo uploads (a private or signed-URL bucket, not public — since even though the group is small, there's no reason to make photos publicly reachable by URL guessing)
  - **Row Level Security (RLS)** policies enforcing "only authenticated app users can read/write," since this is a closed group, not "each user can only see their own data" (the feed is shared)
- **Supabase Edge Functions** (or Vercel Cron + a Next.js API route) for scheduled jobs:
  - Weekly recap generation, run every Sunday
  - Time capsule unlock check (can also just be a query-time filter on unlock_at <= now(), no scheduled job strictly required — see `DATABASE_SCHEMA.md`)

## Image handling

- Photos uploaded client-side, resized/compressed in-browser before upload (keeps storage and bandwidth small — this matters more than it sounds like at 20 users posting photos regularly)
- Supabase Storage signed URLs for serving images, short expiry, refreshed on each feed load

## Hosting & cost

- **Vercel** (free hobby tier is plenty for 20 users) for the Next.js app
- **Supabase** free tier covers Postgres + Auth + Storage at this scale comfortably; only concern is Storage limits if photo volume gets large over months — worth checking after a few months of real usage
- Total expected cost: **$0/month** at this user count, unless photo storage grows past free tier limits (unlikely for a while)

## Why this stack over alternatives

- **Why not a full custom backend (Express/Fastify + separate DB host)?** More moving parts to deploy and maintain for a solo dev, no meaningful benefit at this scale.
- **Why not Firebase?** Supabase gives relational Postgres (better fit for streaks/heatmaps/relational queries like weekly recap aggregation) and is more pleasant to query and reason about than Firestore's NoSQL model.
- **Why not a native app?** No app store distribution needed or wanted for 20 people; a PWA installs in seconds via a link and supports push notifications on modern iOS/Android.

## Recommended build approach

This is a real multi-week build with auth, file storage, scheduled jobs, and several custom UI screens — complex enough that it's better handled by **Claude Code** working directly in this repo over multiple sessions, rather than generated in one shot. Use `ROADMAP.md` to work through it in phases, and `CLAUDE.md` for working conventions.
