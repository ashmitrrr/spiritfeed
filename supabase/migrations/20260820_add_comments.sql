-- Adds lightweight comments on posts: one flat line per reply, no threading,
-- matching the app's "restrained, low-pressure" design (see README/PRD).
-- Applied live via the Supabase MCP; this file exists so schema history is
-- actually reproducible going forward instead of living only in the dashboard.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);

alter table public.comments enable row level security;

-- Same shared-group-data pattern as reactions/posts: any authenticated
-- SpiritFeed user can read everything, but can only write/delete their own.
create policy "authenticated read comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "users insert own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "users delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

alter publication supabase_realtime add table public.comments;
