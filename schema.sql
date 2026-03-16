-- Milene Hinnete Dashboard — Supabase schema
-- Run this in the Supabase SQL editor before seed.sql

create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade text not null,
  grade_type text,
  graded_at date,
  deadline date,
  description text,
  raw_email_text text,
  created_at timestamp with time zone default now()
);

create table if not exists grade_status (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid references grades(id) on delete cascade,
  status text not null default 'open', -- open | done | wont_fix
  note text,
  updated_by text, -- 'parent' | 'milene' | 'system'
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists grade_status_grade_id_idx on grade_status(grade_id);
create index if not exists grade_status_created_at_idx on grade_status(created_at desc);
create index if not exists grades_created_at_idx on grades(created_at desc);
create index if not exists grades_deadline_idx on grades(deadline);

-- Enable Row Level Security
alter table grades enable row level security;
alter table grade_status enable row level security;

-- RLS policies for grades
create policy "Authenticated users can view grades"
  on grades for select
  to authenticated
  using (true);

create policy "Authenticated users can insert grades"
  on grades for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update grades"
  on grades for update
  to authenticated
  using (true);

-- RLS policies for grade_status
create policy "Authenticated users can view grade_status"
  on grade_status for select
  to authenticated
  using (true);

create policy "Authenticated users can insert grade_status"
  on grade_status for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update grade_status"
  on grade_status for update
  to authenticated
  using (true);
