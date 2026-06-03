-- Local development auth seed.
-- Password used by src/lib/dev-auth.ts: seen-local-dev-password

with seed_user as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    phone_change,
    phone_change_token,
    email_change_token_current,
    reauthentication_token,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'nicolas.becharat@gmail.com',
    crypt('seen-local-dev-password', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nicolas Becharat"}'::jsonb,
    '',
    '',
    '',
    '',
    now(),
    now()
  )
  on conflict (email) where (is_sso_user = false)
  do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change = '',
    phone_change = '',
    phone_change_token = '',
    email_change_token_current = '',
    reauthentication_token = '',
    deleted_at = null,
    updated_at = now()
  returning id, email
)
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id::text,
  id,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from seed_user
on conflict (provider_id, provider)
do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();
