-- Scalable rating aggregates.
--
-- The previous movie_review_stats / series_episode_review_stats views recomputed
-- AVG + GROUP BY over every (episode) review on each read, and the client even
-- pulled every raw rating down to build a histogram. That is O(reviews) per page
-- view and does not scale.
--
-- Instead we keep three denormalized aggregate tables maintained by triggers
-- (running sum/count + a 10-bucket histogram). Reads become a single indexed row
-- (O(1)); writes pay a tiny constant cost. The legacy views are repointed at
-- these tables so existing service code keeps working, now with a `histogram`
-- column so the client never transfers raw ratings again.
--
-- Series score = average of per-episode averages (threshold N=1: any episode
-- with >=1 rating counts). The series histogram is the flat distribution of all
-- raw episode ratings.
--
-- Half-star scale is unchanged: ratings are stored 1..10, displayed / 2.

-- ---------------------------------------------------------------------------
-- 1. Aggregate tables
-- ---------------------------------------------------------------------------

-- Movies (and any direct-review media): aggregate of public.reviews. Keyed by
-- (tmdb_id, media_type) so a stray legacy tv review never pollutes series math.
create table if not exists public.media_rating_stats (
  tmdb_id      bigint      not null,
  media_type   text        not null,
  sum_rating   bigint      not null default 0,   -- sum of ratings (1..10 units)
  rating_count bigint      not null default 0,   -- rows carrying a rating
  review_count bigint      not null default 0,   -- all rows incl. comment-only
  histogram    integer[]   not null default '{0,0,0,0,0,0,0,0,0,0}',
  updated_at   timestamptz not null default now(),
  primary key (tmdb_id, media_type),
  constraint media_rating_stats_hist_len check (cardinality(histogram) = 10)
);

-- Per-episode aggregate: one row per rated (series, season, episode) coordinate.
create table if not exists public.episode_rating_stats (
  series_tmdb_id bigint      not null,
  season_number  integer     not null,
  episode_number integer     not null,
  sum_rating     bigint      not null default 0,
  rating_count   bigint      not null default 0,
  histogram      integer[]   not null default '{0,0,0,0,0,0,0,0,0,0}',
  updated_at     timestamptz not null default now(),
  primary key (series_tmdb_id, season_number, episode_number),
  constraint episode_rating_stats_hist_len check (cardinality(histogram) = 10)
);

-- Series aggregate: average of episode averages (N=1). sum_of_episode_avgs is
-- numeric (not float) so the running sum cancels exactly when an episode's avg
-- changes or its last rating is removed. Displayed avg is computed in the view.
create table if not exists public.series_rating_stats (
  series_tmdb_id        bigint      not null primary key,
  sum_of_episode_avgs   numeric     not null default 0,  -- sum of per-episode avgs (1..10)
  episodes_with_ratings integer     not null default 0,  -- episodes with >=1 rating
  total_rating_count    bigint      not null default 0,  -- sum of raw episode ratings
  histogram             integer[]   not null default '{0,0,0,0,0,0,0,0,0,0}',
  updated_at            timestamptz not null default now(),
  constraint series_rating_stats_hist_len check (cardinality(histogram) = 10)
);

-- RLS: readable by any authenticated user; never written by clients. All writes
-- go through the SECURITY DEFINER triggers below, which run as the table owner
-- (bypassing RLS), so no write policy is needed here.
alter table public.media_rating_stats   enable row level security;
alter table public.episode_rating_stats enable row level security;
alter table public.series_rating_stats  enable row level security;

create policy "media rating stats are readable by authenticated users"
  on public.media_rating_stats for select to authenticated using (true);
create policy "episode rating stats are readable by authenticated users"
  on public.episode_rating_stats for select to authenticated using (true);
create policy "series rating stats are readable by authenticated users"
  on public.series_rating_stats for select to authenticated using (true);

grant select on public.media_rating_stats   to authenticated;
grant select on public.episode_rating_stats to authenticated;
grant select on public.series_rating_stats  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Histogram delta helper
-- ---------------------------------------------------------------------------

-- Decrement the old rating's bucket and increment the new one, ignoring NULLs.
-- Postgres arrays are 1-based and ratings are 1..10, so rating r maps to h[r].
create or replace function public.hist_delta(h integer[], old_r smallint, new_r smallint)
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

-- ---------------------------------------------------------------------------
-- 3. Trigger functions
-- ---------------------------------------------------------------------------

-- Movies: maintain media_rating_stats directly from public.reviews. Deltas are
-- derived from OLD vs NEW (not TG_OP alone) so a comment-only edit, a rating
-- addition, and a rating change all flow through one correct path.
create or replace function public.reviews_apply_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  k_tmdb bigint := coalesce(new.tmdb_id, old.tmdb_id);
  k_mt   text   := coalesce(new.media_type, old.media_type);
  d_rc   bigint := (case when new.rating is not null then 1 else 0 end)
                 - (case when old.rating is not null then 1 else 0 end);
  d_sum  bigint := coalesce(new.rating, 0)::bigint - coalesce(old.rating, 0)::bigint;
  d_rev  bigint := case when tg_op = 'INSERT' then 1
                        when tg_op = 'DELETE' then -1
                        else 0 end;
begin
  insert into public.media_rating_stats as s
    (tmdb_id, media_type, sum_rating, rating_count, review_count, histogram, updated_at)
  values
    (k_tmdb, k_mt, d_sum, greatest(d_rc, 0), greatest(d_rev, 0),
     public.hist_delta(array[0,0,0,0,0,0,0,0,0,0], old.rating, new.rating), now())
  on conflict (tmdb_id, media_type) do update set
    sum_rating   = s.sum_rating   + d_sum,
    rating_count = s.rating_count + d_rc,
    review_count = s.review_count + d_rev,
    histogram    = public.hist_delta(s.histogram, old.rating, new.rating),
    updated_at   = now();
  return null;
end;
$$;

-- Episodes: two phases.
--   A) Update the per-episode aggregate; lock its row FIRST to read the exact
--      pre-state (old sum/count/histogram) without a scan.
--   B) Apply the avg-of-avgs delta to the series aggregate: move
--      sum_of_episode_avgs by (new_episode_avg - old_episode_avg), and bump
--      episodes_with_ratings only when the episode crosses 0<->1 ratings.
create or replace function public.episode_reviews_apply_rating_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  k_series   bigint  := coalesce(new.series_tmdb_id, old.series_tmdb_id);
  k_season   integer := coalesce(new.season_number, old.season_number);
  k_ep       integer := coalesce(new.episode_number, old.episode_number);
  d_rc       bigint  := (case when new.rating is not null then 1 else 0 end)
                      - (case when old.rating is not null then 1 else 0 end);
  d_sum      bigint  := coalesce(new.rating, 0)::bigint - coalesce(old.rating, 0)::bigint;
  old_sum    bigint;
  old_cnt    bigint;
  old_hist   integer[];
  new_sum    bigint;
  new_cnt    bigint;
  old_avg    numeric;
  new_avg    numeric;
  d_episodes integer;
  d_avgsum   numeric;
begin
  -- Phase A -----------------------------------------------------------------
  select sum_rating, rating_count, histogram
    into old_sum, old_cnt, old_hist
  from public.episode_rating_stats
  where series_tmdb_id = k_series
    and season_number  = k_season
    and episode_number = k_ep
  for update;

  if not found then
    old_sum := 0; old_cnt := 0; old_hist := array[0,0,0,0,0,0,0,0,0,0];
  end if;

  new_sum := old_sum + d_sum;
  new_cnt := old_cnt + d_rc;
  old_avg := case when old_cnt > 0 then old_sum::numeric / old_cnt else null end;
  new_avg := case when new_cnt > 0 then new_sum::numeric / new_cnt else null end;

  if new_cnt <= 0 then
    -- Last rating gone: drop the episode row to keep the table sparse.
    delete from public.episode_rating_stats
    where series_tmdb_id = k_series
      and season_number  = k_season
      and episode_number = k_ep;
  else
    insert into public.episode_rating_stats as e
      (series_tmdb_id, season_number, episode_number, sum_rating, rating_count, histogram, updated_at)
    values
      (k_series, k_season, k_ep, new_sum, new_cnt,
       public.hist_delta(old_hist, old.rating, new.rating), now())
    on conflict (series_tmdb_id, season_number, episode_number) do update set
      sum_rating   = new_sum,
      rating_count = new_cnt,
      histogram    = public.hist_delta(old_hist, old.rating, new.rating),
      updated_at   = now();
  end if;

  -- Phase B -----------------------------------------------------------------
  d_episodes := (case when new_cnt > 0 then 1 else 0 end)
              - (case when old_cnt > 0 then 1 else 0 end);
  d_avgsum   := coalesce(new_avg, 0) - coalesce(old_avg, 0);

  insert into public.series_rating_stats as s
    (series_tmdb_id, sum_of_episode_avgs, episodes_with_ratings, total_rating_count, histogram, updated_at)
  values
    (k_series, d_avgsum, greatest(d_episodes, 0), greatest(d_rc, 0),
     public.hist_delta(array[0,0,0,0,0,0,0,0,0,0], old.rating, new.rating), now())
  on conflict (series_tmdb_id) do update set
    sum_of_episode_avgs   = s.sum_of_episode_avgs   + d_avgsum,
    episodes_with_ratings = s.episodes_with_ratings + d_episodes,
    total_rating_count    = s.total_rating_count    + d_rc,
    histogram             = public.hist_delta(s.histogram, old.rating, new.rating),
    updated_at            = now();

  return null;
end;
$$;

create trigger reviews_apply_rating_stats
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_apply_rating_stats();

create trigger episode_reviews_apply_rating_stats
  after insert or update or delete on public.episode_reviews
  for each row execute function public.episode_reviews_apply_rating_stats();

-- ---------------------------------------------------------------------------
-- 4. Backfill from existing rows (the only full scan in this design, one-time)
-- ---------------------------------------------------------------------------

insert into public.media_rating_stats
  (tmdb_id, media_type, sum_rating, rating_count, review_count, histogram)
select
  tmdb_id,
  media_type,
  coalesce(sum(rating) filter (where rating is not null), 0),
  count(*) filter (where rating is not null),
  count(*),
  array[
    count(*) filter (where rating = 1), count(*) filter (where rating = 2),
    count(*) filter (where rating = 3), count(*) filter (where rating = 4),
    count(*) filter (where rating = 5), count(*) filter (where rating = 6),
    count(*) filter (where rating = 7), count(*) filter (where rating = 8),
    count(*) filter (where rating = 9), count(*) filter (where rating = 10)
  ]::integer[]
from public.reviews
group by tmdb_id, media_type;

insert into public.episode_rating_stats
  (series_tmdb_id, season_number, episode_number, sum_rating, rating_count, histogram)
select
  series_tmdb_id, season_number, episode_number,
  coalesce(sum(rating), 0),
  count(*),
  array[
    count(*) filter (where rating = 1), count(*) filter (where rating = 2),
    count(*) filter (where rating = 3), count(*) filter (where rating = 4),
    count(*) filter (where rating = 5), count(*) filter (where rating = 6),
    count(*) filter (where rating = 7), count(*) filter (where rating = 8),
    count(*) filter (where rating = 9), count(*) filter (where rating = 10)
  ]::integer[]
from public.episode_reviews
where rating is not null
group by series_tmdb_id, season_number, episode_number;

insert into public.series_rating_stats
  (series_tmdb_id, sum_of_episode_avgs, episodes_with_ratings, total_rating_count, histogram)
select
  series_tmdb_id,
  coalesce(sum(sum_rating::numeric / rating_count), 0),
  count(*),
  coalesce(sum(rating_count), 0),
  array[
    coalesce(sum(histogram[1]),  0), coalesce(sum(histogram[2]),  0),
    coalesce(sum(histogram[3]),  0), coalesce(sum(histogram[4]),  0),
    coalesce(sum(histogram[5]),  0), coalesce(sum(histogram[6]),  0),
    coalesce(sum(histogram[7]),  0), coalesce(sum(histogram[8]),  0),
    coalesce(sum(histogram[9]),  0), coalesce(sum(histogram[10]), 0)
  ]::integer[]
from public.episode_rating_stats
group by series_tmdb_id;

-- ---------------------------------------------------------------------------
-- 5. Repoint the legacy views at the aggregate tables (drop + recreate because
--    avg_rating's type changes). Each now reads a single indexed row and
--    exposes the histogram so the client stops pulling raw ratings.
-- ---------------------------------------------------------------------------

drop view if exists public.movie_review_stats;
create view public.movie_review_stats
with (security_invoker = on)
as
select
  tmdb_id,
  media_type,
  rating_count,
  case when rating_count > 0
       then (sum_rating::numeric / rating_count) / 2.0
       else null end as avg_rating,
  review_count,
  histogram
from public.media_rating_stats
where review_count > 0;

grant select on public.movie_review_stats to authenticated;

drop view if exists public.series_episode_review_stats;
create view public.series_episode_review_stats
with (security_invoker = on)
as
select
  series_tmdb_id   as tmdb_id,
  'tv'::text       as media_type,
  total_rating_count as rating_count,
  case when episodes_with_ratings > 0
       then (sum_of_episode_avgs / episodes_with_ratings) / 2.0
       else null end as avg_rating,
  total_rating_count as review_count,
  histogram
from public.series_rating_stats
where total_rating_count > 0;

grant select on public.series_episode_review_stats to authenticated;
