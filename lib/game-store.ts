"use client"

import { createContext, useContext } from "react"
import type { Room, Player, Message, Vote } from "./supabase"

export type GameState = {
  screen: "home" | "lobby" | "game" | "meeting" | "results"
  playerId: string
  playerName: string
  playerColor: string
  room: Room | null
  players: Player[]
  messages: Message[]
  votes: Vote[]
  currentMeetingId: string | null
  myRole: "crew" | "impostor"
  isAlive: boolean
}

export type GameActions = {
  setScreen: (screen: GameState["screen"]) => void
  setPlayerInfo: (name: string, color: string) => void
  setRoom: (room: Room | null) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  removePlayer: (playerId: string) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setVotes: (votes: Vote[]) => void
  addVote: (vote: Vote) => void
  clearVotes: () => void
  setMeetingId: (id: string | null) => void
  setMyRole: (role: "crew" | "impostor") => void
  setIsAlive: (alive: boolean) => void
  reset: () => void
}

export const GameContext = createContext<(GameState & GameActions) | null>(null)

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be inside GameProvider")
  return ctx
}
