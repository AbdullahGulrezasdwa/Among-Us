import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Room = {
  id: string
  code: string
  host_id: string
  status: "lobby" | "playing" | "meeting" | "ended"
  map: string
  max_players: number
  impostors: number
  winner: string | null
  meeting_caller: string | null
  created_at: string
}

export type Player = {
  id: string
  room_id: string
  player_id: string
  name: string
  color: string
  role: "crew" | "impostor"
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

export const COLORS = [
  { name: "cyan", hex: "#00ffff", glow: "0 0 20px #00ffff" },
  { name: "magenta", hex: "#ff00ff", glow: "0 0 20px #ff00ff" },
  { name: "lime", hex: "#00ff00", glow: "0 0 20px #00ff00" },
  { name: "orange", hex: "#ff6600", glow: "0 0 20px #ff6600" },
  { name: "yellow", hex: "#ffff00", glow: "0 0 20px #ffff00" },
  { name: "red", hex: "#ff0033", glow: "0 0 20px #ff0033" },
  { name: "blue", hex: "#0066ff", glow: "0 0 20px #0066ff" },
  { name: "pink", hex: "#ff66cc", glow: "0 0 20px #ff66cc" },
  { name: "white", hex: "#ffffff", glow: "0 0 20px #ffffff" },
  { name: "purple", hex: "#9933ff", glow: "0 0 20px #9933ff" },
]

export const HATS = [
  { id: "none", name: "None", icon: null },
  { id: "crown", name: "Crown", icon: "crown" },
  { id: "antenna", name: "Antenna", icon: "radio" },
  { id: "flower", name: "Flower", icon: "flower" },
  { id: "hardhat", name: "Hard Hat", icon: "hard-hat" },
  { id: "halo", name: "Halo", icon: "circle" },
  { id: "horns", name: "Horns", icon: "flame" },
  { id: "headphones", name: "Headphones", icon: "headphones" },
  { id: "cloud", name: "Cloud", icon: "cloud" },
  { id: "box", name: "Box", icon: "box" },
  { id: "leaves", name: "Leaves", icon: "wind" },
  { id: "helmet", name: "Helmet", icon: "shield" },
]

export const SKINS = [
  { id: "none", name: "Default" },
  { id: "astronaut", name: "Astronaut" },
  { id: "captain", name: "Captain" },
  { id: "mechanic", name: "Mechanic" },
  { id: "scientist", name: "Scientist" },
  { id: "security", name: "Security" },
  { id: "medic", name: "Medic" },
  { id: "military", name: "Military" },
  { id: "miner", name: "Miner" },
  { id: "hazmat", name: "Hazmat" },
  { id: "police", name: "Police" },
  { id: "prisoner", name: "Prisoner" },
]

export function getColorHex(name: string) {
  return COLORS.find((c) => c.name === name)?.hex ?? "#00ffff"
}

export function getColorGlow(name: string) {
  return COLORS.find((c) => c.name === name)?.glow ?? "0 0 20px #00ffff"
}

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function generatePlayerId() {
  return crypto.randomUUID()
}
