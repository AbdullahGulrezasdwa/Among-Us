-- Neon Impostor: multiplayer social-deduction schema
-- Tables: rooms, players, messages, votes
-- All public + permissive policies (no auth, anonymous play via client-side player_id)

create extension if not exists "pgcrypto";

-- ROOMS ----------------------------------------------------------------
create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  host_id     text not null,
  status      text not null default 'lobby', -- lobby | playing | meeting | ended
  map         text not null default 'skeld',
  max_players integer not null default 10,
  impostors   integer not null default 1,
  winner      text,                            -- crew | impostors
  meeting_caller text,
  created_at  timestamptz default now()
);

-- PLAYERS --------------------------------------------------------------
create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references public.rooms(id) on delete cascade,
  player_id  text not null,                    -- client-generated stable id
  name       text not null,
  color      text not null default 'cyan',
  role       text not null default 'crew',     -- crew | impostor
  is_ready   boolean not null default false,
  is_alive   boolean not null default true,
  is_host    boolean not null default false,
  tasks_done integer not null default 0,
  tasks_total integer not null default 5,
  joined_at  timestamptz default now(),
  unique (room_id, player_id)
);

-- MESSAGES -------------------------------------------------------------
create table if not exists public.messages (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid references public.rooms(id) on delete cascade,
  player_id text not null,
  name      text not null,
  color     text not null default 'cyan',
  body      text not null,
  channel   text not null default 'lobby',     -- lobby | meeting | dead
  created_at timestamptz default now()
);

-- VOTES ----------------------------------------------------------------
create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid references public.rooms(id) on delete cascade,
  meeting_id   text not null,                  -- groups votes for one meeting
  voter_id     text not null,
  target_id    text,                           -- null = skip
  created_at   timestamptz default now(),
  unique (room_id, meeting_id, voter_id)
);

-- INDEXES --------------------------------------------------------------
create index if not exists idx_players_room    on public.players(room_id);
create index if not exists idx_messages_room   on public.messages(room_id, created_at);
create index if not exists idx_votes_meeting   on public.votes(room_id, meeting_id);

-- ROW LEVEL SECURITY: enable + open policies (anonymous play) ----------
alter table public.rooms    enable row level security;
alter table public.players  enable row level security;
alter table public.messages enable row level security;
alter table public.votes    enable row level security;

drop policy if exists "rooms_all"    on public.rooms;
drop policy if exists "players_all"  on public.players;
drop policy if exists "messages_all" on public.messages;
drop policy if exists "votes_all"    on public.votes;

create policy "rooms_all"    on public.rooms    for all using (true) with check (true);
create policy "players_all"  on public.players  for all using (true) with check (true);
create policy "messages_all" on public.messages for all using (true) with check (true);
create policy "votes_all"    on public.votes    for all using (true) with check (true);

-- REALTIME publication -------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.votes;
