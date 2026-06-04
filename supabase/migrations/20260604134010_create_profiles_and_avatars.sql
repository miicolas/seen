-- Public Seen profiles plus avatar storage. Profiles are visible to signed-in
-- users, but only the owner can create/update/delete their own row.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  username    text not null unique,
  avatar_path text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_full_name_not_blank
    check (length(btrim(full_name)) > 0),

  constraint profiles_username_format
    check (username = lower(username) and username ~ '^[a-z0-9_.]{3,20}$')
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "users insert their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "users delete their own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

create or replace function public.profile_default_username(
  user_email text,
  user_id uuid
)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  base text;
  candidate text;
  suffix text;
  attempt integer := 0;
begin
  base := lower(
    regexp_replace(
      coalesce(nullif(split_part(user_email, '@', 1), ''), 'user'),
      '[^a-z0-9_.]+',
      '_',
      'g'
    )
  );
  base := regexp_replace(base, '^[_.]+|[_.]+$', '', 'g');

  if length(base) < 3 then
    base := 'user';
  end if;

  base := left(base, 20);
  candidate := base;

  while exists (select 1 from public.profiles where username = candidate) loop
    attempt := attempt + 1;
    suffix := '_' || left(md5(user_id::text || attempt::text), 6);
    candidate := left(base, greatest(3, 20 - length(suffix))) || suffix;
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(new.email, '@', 1)), ''),
    'Utilisateur'
  );

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    display_name,
    public.profile_default_username(new.email, new.id)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.profile_default_username(text, uuid) from public;
revoke all on function public.handle_new_user_profile() from public;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

insert into public.profiles (id, full_name, username)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(users.email, '@', 1)), ''),
    'Utilisateur'
  ) as full_name,
  public.profile_default_username(users.email, users.id) as username
from auth.users as users
where users.deleted_at is null
on conflict (id) do nothing;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to authenticated;

create policy "users select their own avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())::text
  );

create policy "users upload avatars to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users update their own avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())::text
  );
