alter table public.reviews
  add column if not exists title text;

alter table public.reviews
  drop constraint if exists reviews_has_content;

alter table public.reviews
  add constraint reviews_has_content
  check (
    rating is not null
    or (title is not null and length(btrim(title)) > 0)
    or (comment is not null and length(btrim(comment)) > 0)
  );
