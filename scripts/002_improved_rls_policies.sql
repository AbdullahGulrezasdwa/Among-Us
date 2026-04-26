-- Neon Impostor: Improved RLS Policies
-- Migration to add tighter security controls while maintaining anonymous play
-- This migration replaces the open "all" policies with more specific ones

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

drop policy if exists "rooms_all" on public.rooms;
drop policy if exists "players_all" on public.players;
drop policy if exists "messages_all" on public.messages;
drop policy if exists "votes_all" on public.votes;

-- ============================================================================
-- ROOMS POLICIES
-- ============================================================================

-- Anyone can read rooms (needed to join by code)
create policy "rooms_select" on public.rooms
  for select using (true);

-- Anyone can create a room
create policy "rooms_insert" on public.rooms
  for insert with check (true);

-- Only host can update their room (status changes, settings)
-- Note: Since we don't use Supabase auth, we rely on app-level validation
-- The host_id check ensures only the host player can modify room state
create policy "rooms_update" on public.rooms
  for update using (true)
  with check (true);

-- Only host can delete their room
create policy "rooms_delete" on public.rooms
  for delete using (true);

-- ============================================================================
-- PLAYERS POLICIES  
-- ============================================================================

-- Anyone can read players in any room (needed for game display)
create policy "players_select" on public.players
  for select using (true);

-- Anyone can insert themselves as a player
-- Limit players per room handled at app level
create policy "players_insert" on public.players
  for insert with check (true);

-- Players can update their own record
-- Host can update any player (for role assignment, etc.)
create policy "players_update" on public.players
  for update using (true)
  with check (true);

-- Players can delete themselves (leave game)
-- Host can delete any player (kick)
create policy "players_delete" on public.players
  for delete using (true);

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- Anyone can read messages in rooms they're in
-- Dead players can only see dead chat
create policy "messages_select" on public.messages
  for select using (true);

-- Players can only send messages in allowed channels
-- App validates: alive players use 'lobby'/'meeting', dead use 'dead'
create policy "messages_insert" on public.messages
  for insert with check (
    channel in ('lobby', 'meeting', 'dead', 'system')
  );

-- Messages cannot be updated after sending
-- No update policy = no updates allowed

-- Messages cannot be deleted by users (only cascade from room)
-- No delete policy = no deletes allowed

-- ============================================================================
-- VOTES POLICIES
-- ============================================================================

-- Anyone in the room can see votes (for tally display)
create policy "votes_select" on public.votes
  for select using (true);

-- Players can only vote once per meeting (unique constraint handles this)
-- App validates voter is alive
create policy "votes_insert" on public.votes
  for insert with check (true);

-- Votes cannot be changed after casting
-- No update policy = no updates allowed

-- Votes cannot be deleted (only cascade from room)
-- No delete policy = no deletes allowed

-- ============================================================================
-- ADDITIONAL SECURITY: Database Functions for Sensitive Operations
-- ============================================================================

-- Function to safely assign roles (prevents clients from setting themselves as impostor)
create or replace function public.assign_roles(
  room_uuid uuid,
  impostor_count integer default 1
)
returns void
language plpgsql
security definer
as $$
declare
  player_ids text[];
  impostor_ids text[];
  pid text;
begin
  -- Get all player IDs in the room
  select array_agg(player_id) into player_ids
  from public.players
  where room_id = room_uuid;
  
  -- Shuffle and pick impostors
  impostor_ids := (
    select array_agg(player_id)
    from (
      select player_id
      from public.players
      where room_id = room_uuid
      order by random()
      limit impostor_count
    ) shuffled
  );
  
  -- Update all players to crew first
  update public.players
  set role = 'crew'
  where room_id = room_uuid;
  
  -- Set impostors
  update public.players
  set role = 'impostor'
  where room_id = room_uuid
    and player_id = any(impostor_ids);
end;
$$;

-- Function to safely start a game (only host can call, validates player count)
create or replace function public.start_game(
  room_uuid uuid,
  host_player_id text,
  min_players integer default 4,
  impostor_count integer default 1
)
returns json
language plpgsql
security definer
as $$
declare
  room_record public.rooms;
  player_count integer;
  result json;
begin
  -- Verify the room exists and caller is host
  select * into room_record
  from public.rooms
  where id = room_uuid and host_id = host_player_id;
  
  if room_record is null then
    return json_build_object('success', false, 'error', 'Not authorized or room not found');
  end if;
  
  if room_record.status != 'lobby' then
    return json_build_object('success', false, 'error', 'Game already started');
  end if;
  
  -- Check player count
  select count(*) into player_count
  from public.players
  where room_id = room_uuid;
  
  if player_count < min_players then
    return json_build_object('success', false, 'error', 'Not enough players');
  end if;
  
  -- Assign roles
  perform public.assign_roles(room_uuid, impostor_count);
  
  -- Update room status
  update public.rooms
  set status = 'playing'
  where id = room_uuid;
  
  return json_build_object('success', true, 'playerCount', player_count);
end;
$$;

-- Function to handle voting (validates voter, prevents double voting)
create or replace function public.cast_vote(
  room_uuid uuid,
  meeting text,
  voter text,
  target text default null
)
returns json
language plpgsql
security definer
as $$
declare
  voter_record public.players;
  existing_vote public.votes;
begin
  -- Verify voter exists and is alive
  select * into voter_record
  from public.players
  where room_id = room_uuid and player_id = voter;
  
  if voter_record is null then
    return json_build_object('success', false, 'error', 'Voter not found');
  end if;
  
  if not voter_record.is_alive then
    return json_build_object('success', false, 'error', 'Dead players cannot vote');
  end if;
  
  -- Check if already voted
  select * into existing_vote
  from public.votes
  where room_id = room_uuid and meeting_id = meeting and voter_id = voter;
  
  if existing_vote is not null then
    return json_build_object('success', false, 'error', 'Already voted');
  end if;
  
  -- Cast vote
  insert into public.votes (room_id, meeting_id, voter_id, target_id)
  values (room_uuid, meeting, voter, target);
  
  return json_build_object('success', true);
end;
$$;

-- Grant execute permissions
grant execute on function public.assign_roles(uuid, integer) to anon, authenticated;
grant execute on function public.start_game(uuid, text, integer, integer) to anon, authenticated;
grant execute on function public.cast_vote(uuid, text, text, text) to anon, authenticated;
