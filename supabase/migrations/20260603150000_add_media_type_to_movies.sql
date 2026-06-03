-- Generalize the TMDB cache to hold TV series alongside movies.
-- TMDB ids are only unique *within* a media type (a movie and a TV show can
-- share the same numeric id), so `tmdb_id` alone is no longer a safe key.
-- Add `media_type` and make the primary key composite (tmdb_id, media_type).

alter table public.movies
  add column if not exists media_type text not null default 'movie';

alter table public.movies
  add constraint movies_media_type_check
  check (media_type in ('movie', 'tv'));

-- Swap the single-column PK for a composite one. Existing rows default to
-- 'movie', so the new (tmdb_id, 'movie') pairs stay unique.
alter table public.movies drop constraint movies_pkey;
alter table public.movies add primary key (tmdb_id, media_type);
