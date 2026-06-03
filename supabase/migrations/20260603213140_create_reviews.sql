-- User ratings + reviews, Letterboxd-style. One editable review per
-- (user, movie). A "movie" here is any TMDB item (film or TV), keyed by the
-- composite (tmdb_id, media_type) that matches public.movies.
--
-- rating is a smallint 1..10 where each unit = half a star (1 = 0.5★, 10 = 5★).
-- A single CHECK enforces both the range and the half-step granularity, the
-- column stays 2 bytes, and integer aggregates are fast. Display = rating / 2.
-- Either a rating or a comment (or both) must be present, mirroring Letterboxd.
--
-- FUTURE: a diary model (same film logged on several watch dates) would drop
-- the unique constraint and add a `watched_on date` + keep the surrogate id.

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  tmdb_id     bigint not null,
  media_type  text   not null,
  rating      smallint,
  comment     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Composite FK into the TMDB cache; the movie row must exist first.
  -- restrict: never strand reviews by pruning a movie out from under them.
  constraint reviews_movie_fkey
    foreign key (tmdb_id, media_type)
    references public.movies (tmdb_id, media_type)
    on delete restrict,

  -- One editable review per user per movie -> enables upsert on conflict.
  constraint reviews_user_movie_unique
    unique (user_id, tmdb_id, media_type),

  -- Half-star scale: 1..10. NULL means "comment only, no rating".
  constraint reviews_rating_range
    check (rating is null or rating between 1 and 10),

  -- Must say something: a rating, a non-empty comment, or both.
  constraint reviews_has_content
    check (rating is not null or (comment is not null and length(btrim(comment)) > 0))
);

-- Feed of all reviews for a film (detail screen), newest first.
create index if not exists reviews_movie_idx
  on public.reviews (tmdb_id, media_type, created_at desc);

-- A user's own diary/profile, newest first.
create index if not exists reviews_user_idx
  on public.reviews (user_id, created_at desc);

-- Reuse the trigger fn defined in the movies migration.
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row
  execute function public.set_updated_at();

-- RLS: anyone authenticated can read every review (public feed); a user may
-- write only their own rows.
alter table public.reviews enable row level security;

create policy "reviews are readable by authenticated users"
  on public.reviews for select to authenticated using (true);

create policy "users insert their own reviews"
  on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);

create policy "users update their own reviews"
  on public.reviews for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users delete their own reviews"
  on public.reviews for delete to authenticated
  using (auth.uid() = user_id);

-- Per-movie aggregate rating. avg_rating is on the 0.5..5 star scale (the
-- stored smallint / 2); counts only rows that carry a rating.
create or replace view public.movie_review_stats as
select
  tmdb_id,
  media_type,
  count(*) filter (where rating is not null)          as rating_count,
  avg(rating) filter (where rating is not null) / 2.0 as avg_rating,
  count(*)                                            as review_count
from public.reviews
group by tmdb_id, media_type;

-- Run the view's query as the calling user so reviews' RLS still applies (PG 17).
alter view public.movie_review_stats set (security_invoker = on);
