-- Custom SQL migration file, put your code below! --
-- Domain runtime objects: constraints, rating-stats triggers and the
-- review-stats views. These are not expressible in the Drizzle TS schema
-- (the views are declared `.existing()`), so they live in this custom
-- migration. Written idempotently so it is safe to re-run on any database.

alter table public.reviews drop constraint if exists reviews_movie_fkey;
alter table public.reviews
  add constraint reviews_movie_fkey
  foreign key (tmdb_id, media_type)
  references public.movies (tmdb_id, media_type)
  on delete restrict;

alter table public.media_rating_stats drop constraint if exists media_rating_stats_hist_len;
alter table public.media_rating_stats
  add constraint media_rating_stats_hist_len check (cardinality(histogram) = 10);

alter table public.episode_rating_stats drop constraint if exists episode_rating_stats_hist_len;
alter table public.episode_rating_stats
  add constraint episode_rating_stats_hist_len check (cardinality(histogram) = 10);

alter table public.series_rating_stats drop constraint if exists series_rating_stats_hist_len;
alter table public.series_rating_stats
  add constraint series_rating_stats_hist_len check (cardinality(histogram) = 10);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger movies_set_updated_at
  before update on public.movies
  for each row execute function public.set_updated_at();

create or replace trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create or replace trigger episode_reviews_set_updated_at
  before update on public.episode_reviews
  for each row execute function public.set_updated_at();

create or replace function public.hist_delta(
  h integer[],
  old_r smallint,
  new_r smallint
)
returns integer[]
language plpgsql
immutable
as $$
begin
  if old_r is not null then
    h[old_r] := h[old_r] - 1;
  end if;

  if new_r is not null then
    h[new_r] := h[new_r] + 1;
  end if;

  return h;
end;
$$;

create or replace function public.reviews_apply_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  k_tmdb bigint := coalesce(new.tmdb_id, old.tmdb_id);
  k_mt text := coalesce(new.media_type, old.media_type);
  d_rc bigint := (case when new.rating is not null then 1 else 0 end)
               - (case when old.rating is not null then 1 else 0 end);
  d_sum bigint := coalesce(new.rating, 0)::bigint
                - coalesce(old.rating, 0)::bigint;
  d_rev bigint := case
    when tg_op = 'INSERT' then 1
    when tg_op = 'DELETE' then -1
    else 0
  end;
begin
  insert into public.media_rating_stats as s
    (tmdb_id, media_type, sum_rating, rating_count, review_count, histogram, updated_at)
  values
    (
      k_tmdb,
      k_mt,
      d_sum,
      greatest(d_rc, 0),
      greatest(d_rev, 0),
      public.hist_delta(array[0,0,0,0,0,0,0,0,0,0], old.rating, new.rating),
      now()
    )
  on conflict (tmdb_id, media_type) do update set
    sum_rating = s.sum_rating + d_sum,
    rating_count = s.rating_count + d_rc,
    review_count = s.review_count + d_rev,
    histogram = public.hist_delta(s.histogram, old.rating, new.rating),
    updated_at = now();

  return null;
end;
$$;

create or replace function public.episode_reviews_apply_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  k_series bigint := coalesce(new.series_tmdb_id, old.series_tmdb_id);
  k_season integer := coalesce(new.season_number, old.season_number);
  k_ep integer := coalesce(new.episode_number, old.episode_number);
  d_rc bigint := (case when new.rating is not null then 1 else 0 end)
               - (case when old.rating is not null then 1 else 0 end);
  d_sum bigint := coalesce(new.rating, 0)::bigint
                - coalesce(old.rating, 0)::bigint;
  old_sum bigint;
  old_cnt bigint;
  old_hist integer[];
  new_sum bigint;
  new_cnt bigint;
  old_avg numeric;
  new_avg numeric;
  d_episodes integer;
  d_avgsum numeric;
begin
  select sum_rating, rating_count, histogram
    into old_sum, old_cnt, old_hist
  from public.episode_rating_stats
  where series_tmdb_id = k_series
    and season_number = k_season
    and episode_number = k_ep
  for update;

  if not found then
    old_sum := 0;
    old_cnt := 0;
    old_hist := array[0,0,0,0,0,0,0,0,0,0];
  end if;

  new_sum := old_sum + d_sum;
  new_cnt := old_cnt + d_rc;
  old_avg := case when old_cnt > 0 then old_sum::numeric / old_cnt else null end;
  new_avg := case when new_cnt > 0 then new_sum::numeric / new_cnt else null end;

  if new_cnt <= 0 then
    delete from public.episode_rating_stats
    where series_tmdb_id = k_series
      and season_number = k_season
      and episode_number = k_ep;
  else
    insert into public.episode_rating_stats as e
      (series_tmdb_id, season_number, episode_number, sum_rating, rating_count, histogram, updated_at)
    values
      (
        k_series,
        k_season,
        k_ep,
        new_sum,
        new_cnt,
        public.hist_delta(old_hist, old.rating, new.rating),
        now()
      )
    on conflict (series_tmdb_id, season_number, episode_number) do update set
      sum_rating = new_sum,
      rating_count = new_cnt,
      histogram = public.hist_delta(old_hist, old.rating, new.rating),
      updated_at = now();
  end if;

  d_episodes := (case when new_cnt > 0 then 1 else 0 end)
              - (case when old_cnt > 0 then 1 else 0 end);
  d_avgsum := coalesce(new_avg, 0) - coalesce(old_avg, 0);

  insert into public.series_rating_stats as s
    (
      series_tmdb_id,
      sum_of_episode_avgs,
      episodes_with_ratings,
      total_rating_count,
      histogram,
      updated_at
    )
  values
    (
      k_series,
      d_avgsum,
      greatest(d_episodes, 0),
      greatest(d_rc, 0),
      public.hist_delta(array[0,0,0,0,0,0,0,0,0,0], old.rating, new.rating),
      now()
    )
  on conflict (series_tmdb_id) do update set
    sum_of_episode_avgs = s.sum_of_episode_avgs + d_avgsum,
    episodes_with_ratings = s.episodes_with_ratings + d_episodes,
    total_rating_count = s.total_rating_count + d_rc,
    histogram = public.hist_delta(s.histogram, old.rating, new.rating),
    updated_at = now();

  return null;
end;
$$;

create or replace trigger reviews_apply_rating_stats
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_apply_rating_stats();

create or replace trigger episode_reviews_apply_rating_stats
  after insert or update or delete on public.episode_reviews
  for each row execute function public.episode_reviews_apply_rating_stats();

create or replace view public.movie_review_stats as
select
  tmdb_id,
  media_type,
  rating_count,
  case
    when rating_count > 0 then (sum_rating::numeric / rating_count) / 2.0
    else null
  end as avg_rating,
  review_count,
  histogram
from public.media_rating_stats;

create or replace view public.series_episode_review_stats as
select
  series_tmdb_id as tmdb_id,
  'tv'::text as media_type,
  total_rating_count as rating_count,
  case
    when episodes_with_ratings > 0
      then (sum_of_episode_avgs / episodes_with_ratings) / 2.0
    else null
  end as avg_rating,
  total_rating_count as review_count,
  histogram
from public.series_rating_stats;
