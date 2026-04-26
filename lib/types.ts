// Centralized TypeScript types for the game

export type RoomStatus = "lobby" | "playing" | "meeting" | "ended"
export type PlayerRole = "crew" | "impostor"
export type GameScreen = "home" | "lobby" | "game" | "meeting" | "results"
export type WinnerTeam = "crew" | "impostor" | null

// Database types
export type Room = {
  id: string
  code: string
  host_id: string
  status: RoomStatus
  map: string
  max_players: number
  impostors: number
  winner: WinnerTeam
  meeting_caller: string | null
  created_at: string
}

export type Player = {
  id: string
  room_id: string
  player_id: string
  name: string
  color: string
  role: PlayerRole
  is_ready: boolean
  is_alive: boolean
  is_host: boolean
  tasks_done: number
  tasks_total: number
  joined_at: string
}

export type Message = {
  id: string
  room_id: string
  player_id: string
  name: string
  color: string
  body: string
  channel: string
  created_at: string
}

export type Vote = {
  id: string
  room_id: string
  meeting_id: string
  voter_id: string
  target_id: string | null
  created_at: string
}

// Partial types for updates
export type RoomUpdate = Partial<Omit<Room, "id" | "created_at">>
export type PlayerUpdate = Partial<Omit<Player, "id" | "room_id" | "player_id" | "joined_at">>
export type MessageInsert = Omit<Message, "id" | "created_at">
export type VoteInsert = Omit<Vote, "id" | "created_at">

// Game state types
export type GameState = {
  screen: GameScreen
  playerId: string
  playerName: string
  playerColor: string
  room: Room | null
  players: Player[]
  messages: Message[]
  votes: Vote[]
  currentMeetingId: string | null
  myRole: PlayerRole
  isAlive: boolean
  connectionStatus: ConnectionStatus
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error"

// Color type
export type ColorOption = {
  name: string
  hex: string
  glow: string
}

// Cosmetic types
export type Hat = {
  id: string
  name: string
  icon: string | null
}

export type Skin = {
  id: string
  name: string
}

// API response types
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// Realtime event types
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE"

export type RealtimePayload<T> = {
  eventType: RealtimeEventType
  new: T
  old: Partial<T>
}
