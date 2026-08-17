# Database Schema

Postgres, via Supabase. All tables below are a starting design for Phase 1 — expect small adjustments once real screens are built.

## `users`

Extends Supabase Auth's built-in `auth.users` via a `public.profiles` table (standard Supabase pattern — never put app-specific columns directly on `auth.users`).

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  spirit_animal text not null references public.spirit_animals(key),
  created_at timestamptz not null default now(),
  is_admin boolean not null default false
);
```

- `spirit_animal` is set once at onboarding and treated as immutable in v1 (enforce in application logic; a DB trigger to block updates is a nice belt-and-suspenders option later)
- `is_admin` marks the app owner (invite generation, user removal)

## `spirit_animals`

A fixed reference table of available animals, so the picker UI and uniqueness constraint both read from one source of truth.

```sql
create table public.spirit_animals (
  key text primary key,          -- e.g. 'fox', 'otter', 'axolotl'
  label text not null,           -- e.g. 'Fox'
  icon_url text not null,        -- path to the illustration asset
  taken_by uuid references public.profiles(id)  -- null if available
);
```

- Seed this table with ~25-30 animals so there's headroom above the 15-20 user count
- `taken_by` enforces "no two friends share the same animal" — set atomically when a user picks during onboarding

## `invites`

```sql
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,          -- random, part of the invite URL
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references public.profiles(id),
  expires_at timestamptz
);
```

- Invite link format: `/join/[token]`
- A used or expired token can't be used to create a new account

## `posts`

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  photo_path text,              -- storage path, nullable (status-only posts have no photo)
  caption text,
  created_at timestamptz not null default now(),
  is_time_capsule boolean not null default false,
  unlock_at timestamptz,        -- null unless is_time_capsule = true
  post_type text not null check (post_type in ('photo', 'status'))
);
```

- Feed query: `select * from posts where (is_time_capsule = false or unlock_at <= now()) order by created_at desc`
- A time capsule post is simply excluded from the feed query until its unlock time passes — no scheduled job needed for the unlock itself, just for notifying about it if that's added later

## `statuses`

Current status is really just "most recent status post per user," but a dedicated small table keeps the mood dashboard query trivial and avoids scanning the whole `posts` table for it.

```sql
create table public.statuses (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status_text text,
  updated_at timestamptz not null default now()
);
```

- Upserted whenever a user posts a status update
- Mood dashboard query is just `select profiles.*, statuses.* from profiles left join statuses on ...` — one query, no aggregation

## `reactions`

```sql
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)  -- one of each emoji per user per post
);
```

## `streaks`

Derivable from `posts`/`statuses` at read time via a query, but a small materialized table avoids recomputing on every dashboard load.

```sql
create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date
);
```

- Updated via application logic (or a Postgres trigger on insert into `posts`/`statuses`) whenever a user posts: if `last_active_date` was yesterday, increment; if today, no-op; otherwise reset to 1

## `weekly_recaps`

Stores the generated recap so it doesn't need to be recomputed on every view, and so past recaps stay browsable.

```sql
create table public.weekly_recaps (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  top_post_id uuid references public.posts(id),
  most_active_user_id uuid references public.profiles(id),
  summary_json jsonb not null,   -- flexible payload: streak milestones, capsule unlocks, counts, etc.
  generated_at timestamptz not null default now()
);
```

## Storage buckets

- `photos` — private bucket, one object per post, path convention `photos/{user_id}/{post_id}.jpg`, served via short-lived signed URLs

## RLS notes

Since every table here is shared group data (not per-user private data), RLS policies are simpler than a typical multi-tenant app: the rule is essentially "any authenticated SpiritFeed user can read everything, and can only write/delete rows they own." Exceptions: `invites` writes restricted to admins, `spirit_animals.taken_by` writes restricted to the picking user's own row and only when currently null.
