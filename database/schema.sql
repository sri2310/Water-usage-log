-- Run once in Supabase SQL Editor. Backend uses server-only service-role key.
create extension if not exists pgcrypto;
create table if not exists public.app_users (
 id uuid primary key default gen_random_uuid(),
 name varchar(80) not null,
 email varchar(254) not null unique,
 password_hash text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.water_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.app_users(id) on delete cascade,
 usage_date date not null,
 category varchar(30) not null check(category in ('Drinking','Cooking','Bathing','Laundry','Cleaning','Gardening','Other')),
 liters numeric(10,2) not null check(liters>0 and liters<=100000),
 notes varchar(300) not null default '',
 created_at timestamptz not null default now()
);
create index if not exists water_entries_user_date_idx on public.water_entries(user_id,usage_date desc);
alter table public.app_users enable row level security;
alter table public.water_entries enable row level security;
-- No public policies: only the trusted Express server uses the service-role key.
-- Express verifies sessions and filters every query by authenticated user_id.
