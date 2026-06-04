-- Ratings for individual TV episodes. A TV series rating is derived from the
-- average of its rated episode averages, not from a direct series review.

create table if not exists public.episode_reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  series_tmdb_id  bigint not null,
  episode_tmdb_id bigint not null,
  season_number   integer not null,
  episode_number  integer not null,
  rating          smallint,
  title           text,
  comment         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint episode_reviews_season_number_check
    check (season_number >= 0),

  constraint episode_reviews_episode_number_check
    check (episode_number > 0),

  constraint episode_reviews_rating_range
    check (rating between 1 and 10),

  constraint episode_reviews_has_content
    check (
      rating is not null
      or (title is not null and length(btrim(title)) > 0)
      or (comment is not null and length(btrim(comment)) > 0)
    ),

  constraint episode_reviews_user_episode_unique
    unique (user_id, series_tmdb_id, season_number, episode_number)
);

create index if not exists episode_reviews_series_idx
  on public.episode_reviews (series_tmdb_id, created_at desc);

create index if not exists episode_reviews_episode_idx
  on public.episode_reviews (
    series_tmdb_id,
    season_number,
    episode_number,
    created_at desc
  );

create index if not exists episode_reviews_user_idx
  on public.episode_reviews (user_id, created_at desc);

create trigger episode_reviews_set_updated_at
  before update on public.episode_reviews
  for each row
  execute function public.set_updated_at();

alter table public.episode_reviews enable row level security;

create policy "episode reviews are readable by authenticated users"
  on public.episode_reviews for select to authenticated using (true);

create policy "users insert their own episode reviews"
  on public.episode_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users update their own episode reviews"
  on public.episode_reviews for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users delete their own episode reviews"
  on public.episode_reviews for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.episode_reviews to authenticated;

create or replace view public.series_episode_review_stats
with (security_invoker = true)
as
with episode_avgs as (
  select
    series_tmdb_id,
    season_number,
    episode_number,
    count(*)          as rating_count,
    avg(rating)::real as avg_rating
  from public.episode_reviews
  where rating is not null
  group by series_tmdb_id, season_number, episode_number
)
select
  series_tmdb_id                                   as tmdb_id,
  'tv'::text                                      as media_type,
  coalesce(sum(rating_count), 0)::bigint          as rating_count,
  avg(avg_rating) / 2.0                           as avg_rating,
  coalesce(sum(rating_count), 0)::bigint          as review_count
from episode_avgs
group by series_tmdb_id;

grant select on public.series_episode_review_stats to authenticated;
