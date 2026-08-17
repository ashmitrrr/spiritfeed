# Feature Specs

Screen-by-screen detail for each feature in `PRD.md`. Use this as the source of truth when implementing each piece.

## 1. Invite & onboarding flow

**Screens:** `/join/[token]` → username/password form → spirit animal picker → done, redirected to feed

- Token in URL is validated server-side before showing the form; invalid/used/expired tokens show a friendly "this invite isn't valid" message, not a raw error
- Username: required, unique, no email required from the user (a synthetic email is generated internally for Supabase Auth per `TECH_STACK.md`)
- Password: standard strength requirements, nothing exotic
- Spirit animal picker: a grid of available animals (already-taken ones shown grayed out with whoever's name/animal they are, for fun — "Priya is the Otter"), user taps one, confirms with a "this is forever" style confirmation dialog since it's permanent
- On submit: create the `auth.users` row, `profiles` row, mark the invite `used`, mark the spirit animal `taken_by`

## 2. Login

**Screen:** `/login`

- Username + password, standard Supabase Auth session
- No "forgot password" self-service email flow needed at this scale — app owner can reset via Supabase dashboard if someone gets locked out

## 3. Feed

**Screen:** `/` (home, authenticated)

- Reverse-chronological list of all non-locked posts (time capsules excluded until unlock)
- Each post card: spirit animal avatar + display name, timestamp (relative, e.g. "2h ago"), photo (if any) or status text, caption below photo if present, reaction bar underneath
- Composer entry point at the top of the feed (or a floating action button): tap to open the post composer

## 4. Post composer

**Screen:** modal or dedicated `/new` route

- Two modes, toggled at the top: **Photo** and **Status**
- Photo mode: pick/take a photo (native file/camera input), optional caption field, optional "time capsule" toggle that reveals a date picker for `unlock_at` when enabled
- Status mode: single short text field (enforce a max length, e.g. 100 characters), replaces the user's current status on submit
- Submit writes to `posts` (and to `statuses` if it's a status post), triggers the streak update

## 5. Reactions

**Component:** reaction bar under each post card

- Small fixed emoji set (e.g. 🔥 ❤️ 😂 😮 👀 — final set is a style/taste decision, keep it under 6-8 options)
- Tap to toggle your reaction on/off; shows a small count per emoji when count > 0
- No comments in v1

## 6. Mood dashboard

**Screen:** `/mood`

- Grid or list of every user: spirit animal avatar, name, current status text, and how long ago it was set
- Users with no status set yet show a neutral placeholder ("no status yet")
- This is a read-focused screen — no interaction beyond maybe tapping through to that user's recent posts (nice-to-have, not required for v1)

## 7. Streaks & heatmap

**Screen:** `/streaks` (group view) with drill-in to a per-user detail

- Group view: a simple ranked list or grid of everyone's current streak length (framed lightly, not as a competitive leaderboard — tone matters here)
- Per-user detail: a GitHub-style contribution heatmap (weeks as columns, days as rows) showing posting activity over the last ~3-6 months
- Streak logic lives in `streaks` table per `DATABASE_SCHEMA.md`; update triggered on every new post/status

## 8. Time capsules

- No dedicated screen — time capsules are created via the composer toggle (see #4) and simply appear in the normal feed once unlocked, tagged visually (e.g. a small "⏳ time capsule, written on [date]" label) so it's clear it's not a brand-new post
- Optional nice-to-have for later: a "your pending capsules" view showing what you've written that hasn't unlocked yet, visible only to the author

## 9. Weekly recap

**Screen:** `/recap` (or `/recap/[week]` for browsing past weeks)

- Shows the most recent generated recap by default: top post (by reaction count), most active poster, any streak milestones hit that week, any time capsules that unlocked that week
- Generation: a scheduled job (Sunday night) computes and inserts a row into `weekly_recaps`; the screen just reads the latest row, no live computation needed
- Past weeks browsable via a simple prev/next or list, once more than one recap exists

## 10. Admin (invite management)

**Screen:** `/admin`, visible only to `is_admin = true` users

- Generate a new invite link (creates a row in `invites`, shows the shareable URL)
- List of pending/used invites
- List of current users with a "remove" action (soft delete or full removal — decide when building; soft delete is safer for preserving their historical posts if the group wants that)

## Visual/tone notes

- Minimalist, a little nostalgic — think early social web or an AIM buddy list crossed with a modern clean UI, not a corporate SaaS dashboard
- Spirit animal illustrations should be simple, consistent in style (same illustrator/style pack across all animals), and instantly recognizable at small avatar sizes
- Keep copy playful and casual throughout (this is for friends, not customers)
