-- Call Guide schema. Paste into Supabase > SQL Editor > Run.

create extension if not exists pgcrypto;

create table if not exists calls (
  id            uuid primary key default gen_random_uuid(),
  prospect_name text not null,
  company       text not null,
  role          text,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  current_stage int  not null default 1 check (current_stage between 1 and 8),
  stage_reached int  not null default 1 check (stage_reached between 1 and 8),
  outcome       text check (outcome in (
    'agreed_to_receive_report','next_step_agreed','interested','follow_up',
    'call_again','not_interested','do_not_call','wrong_person',
    'moved_company','not_logged')),
  summary       text
);

-- One row per stage per call. Re-saving a stage replaces the row (upsert), so nothing is lost or duplicated.
create table if not exists stage_results (
  id             uuid primary key default gen_random_uuid(),
  call_id        uuid not null references calls(id) on delete cascade,
  stage          int  not null check (stage between 1 and 8),
  tap_choices    text[] not null default '{}',
  prospect_words text not null default '',
  saved_at       timestamptz not null default now(),
  unique (call_id, stage)
);

create index if not exists calls_started_idx on calls (started_at desc);
create index if not exists stage_results_call_idx on stage_results (call_id);

-- The backend uses the service key. Nobody else should reach these tables directly.
alter table calls enable row level security;
alter table stage_results enable row level security;
