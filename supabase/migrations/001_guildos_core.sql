-- GuildOS core schema
-- Apply with the Supabase CLI or SQL editor after creating the project.

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.guild_member_role as enum ('owner','admin','officer','raid_leader','recruiter','member','trial');
create type public.member_status as enum ('active','inactive','left','banned');
create type public.rsvp_status as enum ('going','maybe','declined');
create type public.application_status as enum ('new','reviewing','interview','accepted','declined','waitlist');
create type public.subscription_tier as enum ('free','pro','network');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  username text not null,
  avatar_url text,
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guilds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  primary_game text not null default 'Custom Game',
  region text,
  timezone text not null default 'America/Chicago',
  playstyle text,
  emblem_url text,
  subscription_tier public.subscription_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.guild_member_role not null default 'member',
  status public.member_status not null default 'active',
  nickname text,
  joined_at timestamptz not null default now(),
  unique (guild_id, user_id)
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  member_id uuid not null references public.guild_members(id) on delete cascade,
  game text not null,
  name text not null,
  class_name text,
  specialization text,
  combat_role text,
  is_main boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  game text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  recurrence_rule text,
  tanks_required integer not null default 0 check (tanks_required >= 0),
  healers_required integer not null default 0 check (healers_required >= 0),
  dps_required integer not null default 0 check (dps_required >= 0),
  allow_maybe boolean not null default true,
  discord_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.guild_members(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  status public.rsvp_status not null,
  combat_role text,
  note text,
  responded_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.guild_members(id) on delete cascade,
  attended boolean not null,
  recorded_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  applicant_user_id uuid references public.profiles(id) on delete set null,
  discord_handle text not null,
  character_name text,
  class_name text,
  combat_role text,
  experience text,
  availability jsonb not null default '{}'::jsonb,
  message text,
  status public.application_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  body text not null,
  discord_message_id text,
  created_at timestamptz not null default now()
);

create table public.discord_integrations (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null unique references public.guilds(id) on delete cascade,
  discord_guild_id text not null unique,
  discord_guild_name text,
  announcements_channel_id text,
  events_channel_id text,
  configured_by uuid not null references public.profiles(id) on delete restrict,
  connected_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null unique references public.guilds(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier public.subscription_tier not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index guild_members_user_idx on public.guild_members(user_id);
create index events_guild_starts_idx on public.events(guild_id, starts_at);
create index rsvps_event_idx on public.event_rsvps(event_id);
create index applications_guild_status_idx on public.applications(guild_id, status);
create index attendance_member_idx on public.attendance(member_id);

-- SECURITY DEFINER helpers live outside the exposed public schema.
create or replace function private.is_guild_member(target_guild uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guild_members gm
    where gm.guild_id = target_guild
      and gm.user_id = (select auth.uid())
      and gm.status = 'active'
  );
$$;

create or replace function private.can_manage_guild(target_guild uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guild_members gm
    where gm.guild_id = target_guild
      and gm.user_id = (select auth.uid())
      and gm.status = 'active'
      and gm.role in ('owner','admin','officer','raid_leader','recruiter')
  );
$$;

revoke all on function private.is_guild_member(uuid) from public;
revoke all on function private.can_manage_guild(uuid) from public;
grant execute on function private.is_guild_member(uuid) to authenticated;
grant execute on function private.can_manage_guild(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.characters enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.attendance enable row level security;
alter table public.applications enable row level security;
alter table public.announcements enable row level security;
alter table public.discord_integrations enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles self read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles self update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members can read guilds" on public.guilds for select to authenticated using (private.is_guild_member(id) or owner_id = (select auth.uid()));
create policy "authenticated users create guilds" on public.guilds for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "managers update guilds" on public.guilds for update to authenticated
using (private.can_manage_guild(id) or owner_id = (select auth.uid()))
with check (private.can_manage_guild(id) or owner_id = (select auth.uid()));

create policy "members read memberships" on public.guild_members for select to authenticated using (private.is_guild_member(guild_id));
create policy "authorized users add memberships" on public.guild_members for insert to authenticated with check (
  private.can_manage_guild(guild_id)
  or (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.guilds g
      where g.id = guild_id
        and g.owner_id = (select auth.uid())
    )
  )
);
create policy "managers update memberships" on public.guild_members for update to authenticated
using (private.can_manage_guild(guild_id))
with check (private.can_manage_guild(guild_id));
create policy "managers remove memberships" on public.guild_members for delete to authenticated using (private.can_manage_guild(guild_id));

create policy "members read characters" on public.characters for select to authenticated using (private.is_guild_member(guild_id));
create policy "members create own characters" on public.characters for insert to authenticated with check (
  private.is_guild_member(guild_id) and exists (
    select 1 from public.guild_members gm where gm.id = member_id and gm.user_id = (select auth.uid())
  )
);
create policy "members update own characters" on public.characters for update to authenticated
using (
  exists (select 1 from public.guild_members gm where gm.id = member_id and gm.user_id = (select auth.uid()))
  or private.can_manage_guild(guild_id)
)
with check (
  exists (select 1 from public.guild_members gm where gm.id = member_id and gm.user_id = (select auth.uid()))
  or private.can_manage_guild(guild_id)
);

create policy "members read events" on public.events for select to authenticated using (private.is_guild_member(guild_id));
create policy "managers create events" on public.events for insert to authenticated with check (
  private.can_manage_guild(guild_id) and creator_id = (select auth.uid())
);
create policy "managers update events" on public.events for update to authenticated
using (private.can_manage_guild(guild_id))
with check (private.can_manage_guild(guild_id));
create policy "managers delete events" on public.events for delete to authenticated using (private.can_manage_guild(guild_id));

create policy "members read rsvps" on public.event_rsvps for select to authenticated using (private.is_guild_member(guild_id));
create policy "members create own rsvp" on public.event_rsvps for insert to authenticated with check (
  private.is_guild_member(guild_id) and exists (
    select 1 from public.guild_members gm where gm.id = member_id and gm.user_id = (select auth.uid())
  )
);
create policy "members update own rsvp" on public.event_rsvps for update to authenticated
using (
  exists (select 1 from public.guild_members gm where gm.id = member_id and gm.user_id = (select auth.uid()))
  or private.can_manage_guild(guild_id)
)
with check (
  exists (select 1 from public.guild_members gm where gm.id = member_id and gm.user_id = (select auth.uid()))
  or private.can_manage_guild(guild_id)
);

create policy "members read attendance" on public.attendance for select to authenticated using (private.is_guild_member(guild_id));
create policy "managers manage attendance" on public.attendance for all to authenticated using (private.can_manage_guild(guild_id)) with check (private.can_manage_guild(guild_id));

create policy "members read applications" on public.applications for select to authenticated using (private.can_manage_guild(guild_id) or applicant_user_id = (select auth.uid()));
create policy "authenticated apply" on public.applications for insert to authenticated with check (applicant_user_id = (select auth.uid()));
create policy "recruiters update applications" on public.applications for update to authenticated
using (private.can_manage_guild(guild_id))
with check (private.can_manage_guild(guild_id));

create policy "members read announcements" on public.announcements for select to authenticated using (private.is_guild_member(guild_id));
create policy "managers create announcements" on public.announcements for insert to authenticated with check (
  private.can_manage_guild(guild_id) and author_id = (select auth.uid())
);

create policy "managers read discord integration" on public.discord_integrations for select to authenticated using (private.can_manage_guild(guild_id));
create policy "managers manage discord integration" on public.discord_integrations for all to authenticated
using (private.can_manage_guild(guild_id))
with check (private.can_manage_guild(guild_id) and configured_by = (select auth.uid()));

create policy "owners read subscriptions" on public.subscriptions for select to authenticated using (
  exists (
    select 1 from public.guild_members gm
    where gm.guild_id = subscriptions.guild_id
      and gm.user_id = (select auth.uid())
      and gm.role in ('owner','admin')
  )
);

-- Explicit Data API permissions. RLS remains the authorization boundary.
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.guilds to authenticated;
grant select, insert, update, delete on public.guild_members to authenticated;
grant select, insert, update on public.characters to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update on public.event_rsvps to authenticated;
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert on public.announcements to authenticated;
grant select, insert, update, delete on public.discord_integrations to authenticated;
grant select on public.subscriptions to authenticated;

-- Create a profile automatically for new Supabase auth users.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url, discord_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'preferred_username', 'Guild Member'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();
