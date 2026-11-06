-- Sajag AI — BACKEND SCHEMA (Supabase / Postgres)
-- Run in Supabase SQL Editor in one go.

create extension if not exists pgcrypto;
create type app_role as enum ('elder','family','analyst','admin');

create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  role app_role not null default 'family',
  full_name text, phone text, family_phone text,
  family_of uuid references profiles(id),            -- family -> elder link
  language text default 'hi-IN',
  consent jsonb default '{"monitoring":true,"transcripts":true,"family_alerts":true}',
  auto_takeover boolean default true,
  created_at timestamptz default now());

create table if not exists calls(
  id uuid primary key default gen_random_uuid(),
  retell_call_id text unique,
  owner_id uuid references profiles(id),
  channel text check (channel in ('phone','web','sim')) default 'sim',
  from_number text, to_number text,
  state text default 'MONITORING',                    -- MONITORING|PENDING_TAKEOVER|DECOY_ACTIVE|ENDED|CANCELLED
  p_scam real default 0, risk_level text default 'LOW',
  scam_category text, signals jsonb default '[]',
  takeover_at timestamptz, started_at timestamptz default now(),
  ended_at timestamptz, duration_s int, decoy_seconds int default 0,
  safety_blocks int default 0, script_fp text, summary text,
  false_positive boolean, created_at timestamptz default now(),
  twilio_meta jsonb default '{}'::jsonb,
  lookup_meta jsonb default '{}'::jsonb);

create table if not exists transcript_turns(
  id bigserial primary key,
  call_id uuid references calls on delete cascade,
  seq int not null, speaker text check (speaker in ('caller','agent','system')),
  text text not null, ts_ms int, hash text, prev_hash text,
  unique(call_id, seq));

create table if not exists risk_events(
  id bigserial primary key, call_id uuid references calls on delete cascade,
  turn_seq int, p_scam real, level text, category text,
  signals jsonb, rationale text, created_at timestamptz default now());

create table if not exists identifiers(
  id bigserial primary key, call_id uuid references calls on delete cascade,
  turn_seq int, type text check (type in ('phone','upi','bank_account','ifsc','url','telegram','email','name_claimed','org_claimed','case_no')),
  value text not null, normalized text not null, syntax_valid boolean,
  quote text, confidence real, source text default 'caller_stated',
  verified boolean default false, superseded boolean default false,
  created_at timestamptz default now(),
  unique(call_id, type, normalized));
create index if not exists idx_identifiers_type_norm on identifiers(type, normalized);

create or replace view identifier_overlap as
  select type, normalized, count(distinct call_id) as calls_seen, array_agg(distinct call_id) as call_ids
  from identifiers where type in ('phone','upi','bank_account','url','telegram','email')
  group by type, normalized having count(distinct call_id) > 1;

create or replace view script_campaigns as
  select script_fp, count(*) as calls_seen, array_agg(id) as call_ids
  from calls where script_fp is not null group by script_fp having count(*) > 1;

create table if not exists reports(
  id uuid primary key default gen_random_uuid(),
  call_id uuid references calls on delete cascade,
  status text default 'draft' check (status in ('draft','approved','exported')),
  payload jsonb not null, pdf_path text, head_hash text,
  approved_by uuid references profiles(id), approved_at timestamptz,
  created_at timestamptz default now());

create table if not exists alerts(
  id bigserial primary key, call_id uuid references calls on delete cascade,
  kind text, channel text check (channel in ('sms','dashboard','email')),
  to_addr text, status text default 'queued', provider_sid text, created_at timestamptz default now());

create table if not exists whitelist(
  owner_id uuid references profiles(id) on delete cascade, 
  number text, 
  label text, 
  primary key(owner_id, number));

create table if not exists audit_log(
  id bigserial primary key, actor uuid, action text, entity text, entity_id text,
  meta jsonb, created_at timestamptz default now());

create table if not exists eval_runs(id bigserial primary key, metrics jsonb, created_at timestamptz default now());

-- Auto profile creation trigger on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin 
  insert into profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new; 
end $$;

-- Extra columns for Twilio Carrier & Lookup v2 metadata (BACKEND_MODULES §5)
alter table calls add column if not exists twilio_meta jsonb default '{}'::jsonb;
alter table calls add column if not exists lookup_meta jsonb default '{}'::jsonb;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- RLS helper functions
create or replace function my_role() returns app_role language sql stable security definer set search_path=public as $$ 
  select role from profiles where id=auth.uid() 
$$;

create or replace function can_see_call(c calls) returns boolean language sql stable security definer set search_path=public as $$
  select my_role() in ('analyst','admin') or c.owner_id = auth.uid()
      or c.owner_id = (select family_of from profiles where id=auth.uid()) 
$$;

alter table profiles enable row level security; 
alter table calls enable row level security;
alter table transcript_turns enable row level security; 
alter table risk_events enable row level security;
alter table identifiers enable row level security; 
alter table reports enable row level security;
alter table alerts enable row level security; 
alter table whitelist enable row level security;
alter table audit_log enable row level security; 
alter table eval_runs enable row level security;

-- Drop existing policies if any
drop policy if exists p_self on profiles;
drop policy if exists p_self_upd on profiles;
drop policy if exists calls_r on calls;
drop policy if exists calls_demo on calls;
drop policy if exists tt_r on transcript_turns;
drop policy if exists re_r on risk_events;
drop policy if exists id_r on identifiers;
drop policy if exists rep_r on reports;
drop policy if exists al_r on alerts;
drop policy if exists wl_all on whitelist;
drop policy if exists au_r on audit_log;
drop policy if exists ev_r on eval_runs;

create policy p_self on profiles for select using (id=auth.uid() or my_role() in ('analyst','admin'));
create policy p_self_upd on profiles for update using (id=auth.uid());
create policy calls_r on calls for select using (can_see_call(calls));
create policy calls_demo on calls for select using (channel in ('sim','web') and owner_id is null and auth.uid() is not null);
create policy tt_r on transcript_turns for select using (exists(select 1 from calls c where c.id=call_id and (can_see_call(c) or (c.owner_id is null and auth.uid() is not null))));
create policy re_r on risk_events for select using (exists(select 1 from calls c where c.id=call_id and (can_see_call(c) or (c.owner_id is null and auth.uid() is not null))));
create policy id_r on identifiers for select using (my_role() in ('analyst','admin') or exists(select 1 from calls c where c.id=call_id and (can_see_call(c) or (c.owner_id is null and auth.uid() is not null))));
create policy rep_r on reports for select using (my_role() in ('analyst','admin'));
create policy al_r on alerts for select using (auth.uid() is not null);
create policy wl_all on whitelist for all using (owner_id=auth.uid());
create policy au_r on audit_log for select using (my_role()='admin');
create policy ev_r on eval_runs for select using (my_role() in ('analyst','admin'));

-- Realtime publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'calls') then
    alter publication supabase_realtime add table calls, transcript_turns, risk_events, identifiers, alerts, reports;
  end if;
exception when others then
  null;
end $$;

-- Extra columns for Twilio Carrier & Lookup v2 metadata (BACKEND_MODULES §5)
alter table calls add column if not exists twilio_meta jsonb default '{}'::jsonb;
alter table calls add column if not exists lookup_meta jsonb default '{}'::jsonb;

