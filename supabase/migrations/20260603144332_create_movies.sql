-- Cache TMDB movies in Supabase to avoid hitting the TMDB API quota.
-- `movies` is keyed by the TMDB movie id (natural key). Edge Function `tmdb`
-- writes here with the service role; the app reads via RLS.

create table if not exists public.movies (
  tmdb_id          bigint primary key,
  title            text not null,
  original_title   text,
  overview         text,
  release_date     date,
  poster_path      text,
  backdrop_path    text,
  vote_average     numeric,
  vote_count       integer,
  popularity       numeric,
  runtime          integer,
  genres           jsonb,
  -- Language the cached payload was fetched in (the app is French).
  language         text not null default 'fr-FR',
  -- Full detail payload (with append_to_response). Null until a detail fetch
  -- happens — rows seen only via search/discover stay "light".
  detail           jsonb,
  -- When the full detail was last fetched. Null = never detailed. Drives the TTL.
  detail_fetched_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Keep `updated_at` fresh on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger movies_set_updated_at
  before update on public.movies
  for each row
  execute function public.set_updated_at();

-- RLS: default-deny. The app (authenticated) may read the cache; writes happen
-- only through the service role inside the `tmdb` Edge Function, which bypasses RLS.
alter table public.movies enable row level security;

create policy "movies are readable by authenticated users"
  on public.movies
  for select
  to authenticated
  using (true);
