import { createClient } from "./supabase"
import type { Room, Player, Message, Vote, ApiResult, RoomUpdate, PlayerUpdate, MessageInsert, VoteInsert } from "./types"

const supabase = createClient()

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Error messages for user-friendly display
const ERROR_MESSAGES: Record<string, string> = {
  "23505": "This action has already been performed",
  "23503": "Referenced data not found",
  "42501": "You don't have permission to perform this action",
  "PGRST116": "No matching record found",
  "connection_error": "Unable to connect to the server. Please check your internet connection.",
  "timeout": "The request timed out. Please try again.",
  "unknown": "Something went wrong. Please try again.",
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const pgError = error as { code?: string }
    if (pgError.code && ERROR_MESSAGES[pgError.code]) {
      return ERROR_MESSAGES[pgError.code]
    }
    return error.message
  }
  return ERROR_MESSAGES.unknown
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: unknown
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on permission or validation errors
      const pgError = error as { code?: string }
      if (pgError.code && ["23505", "23503", "42501"].includes(pgError.code)) {
        throw error
      }
      
      if (i < retries - 1) {
        await new Promise((resolve) => 
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, i))
        )
      }
    }
  }
  
  throw lastError
}

// Room operations
export async function createRoom(room: Omit<Room, "id" | "created_at">): Promise<ApiResult<Room>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from("rooms").insert(room).select().single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getRoom(code: string): Promise<ApiResult<Room>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from("rooms")
        .select()
        .eq("code", code.toUpperCase())
        .single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getRoomById(id: string): Promise<ApiResult<Room>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from("rooms").select().eq("id", id).single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updateRoom(id: string, updates: RoomUpdate): Promise<ApiResult<Room>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from("rooms").update(updates).eq("id", id).select().single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// Player operations
export async function createPlayer(player: Omit<Player, "id" | "joined_at">): Promise<ApiResult<Player>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from("players").insert(player).select().single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getPlayers(roomId: string): Promise<ApiResult<Player[]>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from("players")
        .select()
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true })
    )
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function updatePlayer(
  roomId: string,
  playerId: string,
  updates: PlayerUpdate
): Promise<ApiResult<Player>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from("players")
        .update(updates)
        .eq("room_id", roomId)
        .eq("player_id", playerId)
        .select()
        .single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deletePlayer(roomId: string, playerId: string): Promise<ApiResult<null>> {
  try {
    const { error } = await withRetry(() =>
      supabase
        .from("players")
        .delete()
        .eq("room_id", roomId)
        .eq("player_id", playerId)
    )
    
    if (error) throw error
    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// Message operations
export async function createMessage(message: MessageInsert): Promise<ApiResult<Message>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from("messages").insert(message).select().single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getMessages(roomId: string, channel: string): Promise<ApiResult<Message[]>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from("messages")
        .select()
        .eq("room_id", roomId)
        .eq("channel", channel)
        .order("created_at", { ascending: true })
    )
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// Vote operations
export async function createVote(vote: VoteInsert): Promise<ApiResult<Vote>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase.from("votes").insert(vote).select().single()
    )
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function getVotes(roomId: string, meetingId: string): Promise<ApiResult<Vote[]>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from("votes")
        .select()
        .eq("room_id", roomId)
        .eq("meeting_id", meetingId)
    )
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function deleteVotes(roomId: string): Promise<ApiResult<null>> {
  try {
    const { error } = await withRetry(() =>
      supabase.from("votes").delete().eq("room_id", roomId)
    )
    
    if (error) throw error
    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// Bulk operations
export async function updateAllPlayers(
  roomId: string,
  updates: PlayerUpdate
): Promise<ApiResult<Player[]>> {
  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from("players")
        .update(updates)
        .eq("room_id", roomId)
        .select()
    )
    
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// Check if a player exists in a room
export async function playerExists(roomId: string, playerId: string): Promise<boolean> {
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("player_id", playerId)
    .single()
  
  return !!data
}
