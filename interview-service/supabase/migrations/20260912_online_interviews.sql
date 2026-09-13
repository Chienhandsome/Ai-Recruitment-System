-- Run once in Supabase SQL Editor, or through the Supabase CLI migration flow.
-- The Interview Service uses the service_role key server-side only; no browser
-- client has direct access to either this table or this storage bucket.

create table if not exists public.online_interviews (
  id uuid primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.online_interviews enable row level security;

create or replace function public.set_online_interviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_online_interviews_updated_at on public.online_interviews;
create trigger set_online_interviews_updated_at
before update on public.online_interviews
for each row execute function public.set_online_interviews_updated_at();

-- The bucket is deliberately private. service_role bypasses RLS; do not create
-- public read policies or expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'interview-videos',
  'interview-videos',
  false,
  52428800,
  array['video/webm', 'video/mp4']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
