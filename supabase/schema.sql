-- ============================================================
-- Markmap App – Supabase Schema
-- Run this in your Supabase project SQL editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  alias text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  content text default '# My Mindmap\n## Topic 1\n### Subtopic 1\n## Topic 2',
  is_shared boolean default false,
  share_token uuid default gen_random_uuid() unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Templates table (only 1 row, managed by admin)
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  content text not null default '# Template\n## Section 1\n### Item 1\n### Item 2\n## Section 2\n### Item 1',
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id)
);

-- Insert default template row
insert into public.templates (content) values (
  '# Project Mindmap' || E'\n' ||
  '## Goals' || E'\n' ||
  '### Primary Goal' || E'\n' ||
  '### Secondary Goal' || E'\n' ||
  '## Tasks' || E'\n' ||
  '### Planning' || E'\n' ||
  '### Execution' || E'\n' ||
  '### Review' || E'\n' ||
  '## Resources' || E'\n' ||
  '### Team' || E'\n' ||
  '### Tools'
);

-- ============================================================
-- User groups
-- ============================================================
create table public.user_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null
);

-- Group members junction table
create table public.group_members (
  group_id uuid references public.user_groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.templates enable row level security;
alter table public.user_groups enable row level security;
alter table public.group_members enable row level security;

-- Profiles: own row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Profiles: admin can view and delete all
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Projects: users manage their own
create policy "Users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id);

-- Projects: public read for shared projects (no auth required)
create policy "Public can view shared projects"
  on public.projects for select
  using (is_shared = true);

-- Templates: any authenticated user can read
create policy "Authenticated users can read template"
  on public.templates for select
  using (auth.role() = 'authenticated');

-- Templates: only admins can insert/update
create policy "Admins can manage template"
  on public.templates for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- User groups: admins only
create policy "Admins can manage groups"
  on public.user_groups for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage group members"
  on public.group_members for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Migration: add alias and groups to an existing database
-- (run this block if you already have a database set up)
-- ============================================================
-- alter table public.profiles add column if not exists alias text;
--
-- create table if not exists public.user_groups ( ... );
-- create table if not exists public.group_members ( ... );
--
-- ============================================================
-- After first login, grant admin role to yourself:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@fpt.com';
-- ============================================================
