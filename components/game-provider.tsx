"use client"

import { useState, useCallback, useEffect, type ReactNode } from "react"
import { GameContext, type GameState, type GameActions } from "@/lib/game-store"
import { generatePlayerId } from "@/lib/supabase"

const initialState: GameState = {
  screen: "home",
  playerId: "",
  playerName: "",
  playerColor: "cyan",
  room: null,
  players: [],
  messages: [],
  votes: [],
  currentMeetingId: null,
  myRole: "crew",
  isAlive: true,
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState)

  useEffect(() => {
    // Generate player ID on mount
    let pid = localStorage.getItem("neon_player_id")
    if (!pid) {
      pid = generatePlayerId()
      localStorage.setItem("neon_player_id", pid)
    }
    setState((s) => ({ ...s, playerId: pid! }))
  }, [])

  const setScreen = useCallback<GameActions["setScreen"]>((screen) => {
    setState((s) => ({ ...s, screen }))
  }, [])

  const setPlayerInfo = useCallback<GameActions["setPlayerInfo"]>((name, color) => {
    setState((s) => ({ ...s, playerName: name, playerColor: color }))
  }, [])

  const setRoom = useCallback<GameActions["setRoom"]>((room) => {
    setState((s) => ({ ...s, room }))
  }, [])

  const setPlayers = useCallback<GameActions["setPlayers"]>((players) => {
    setState((s) => ({ ...s, players }))
  }, [])

  const addPlayer = useCallback<GameActions["addPlayer"]>((player) => {
    setState((s) => ({
      ...s,
      players: s.players.some((p) => p.player_id === player.player_id)
        ? s.players
        : [...s.players, player],
    }))
  }, [])

  const updatePlayer = useCallback<GameActions["updatePlayer"]>((playerId, updates) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.player_id === playerId ? { ...p, ...updates } : p
      ),
    }))
  }, [])

  const removePlayer = useCallback<GameActions["removePlayer"]>((playerId) => {
    setState((s) => ({
      ...s,
      players: s.players.filter((p) => p.player_id !== playerId),
    }))
  }, [])

  const setMessages = useCallback<GameActions["setMessages"]>((messages) => {
    setState((s) => ({ ...s, messages }))
  }, [])

  const addMessage = useCallback<GameActions["addMessage"]>((message) => {
    setState((s) => ({ ...s, messages: [...s.messages, message] }))
  }, [])

  const setVotes = useCallback<GameActions["setVotes"]>((votes) => {
    setState((s) => ({ ...s, votes }))
  }, [])

  const addVote = useCallback<GameActions["addVote"]>((vote) => {
    setState((s) => ({
      ...s,
      votes: s.votes.some((v) => v.voter_id === vote.voter_id)
        ? s.votes.map((v) => (v.voter_id === vote.voter_id ? vote : v))
        : [...s.votes, vote],
    }))
  }, [])

  const clearVotes = useCallback<GameActions["clearVotes"]>(() => {
    setState((s) => ({ ...s, votes: [] }))
  }, [])

  const setMeetingId = useCallback<GameActions["setMeetingId"]>((id) => {
    setState((s) => ({ ...s, currentMeetingId: id }))
  }, [])

  const setMyRole = useCallback<GameActions["setMyRole"]>((role) => {
    setState((s) => ({ ...s, myRole: role }))
  }, [])

  const setIsAlive = useCallback<GameActions["setIsAlive"]>((alive) => {
    setState((s) => ({ ...s, isAlive: alive }))
  }, [])

  const reset = useCallback<GameActions["reset"]>(() => {
    setState((s) => ({
      ...initialState,
      playerId: s.playerId,
      playerName: s.playerName,
      playerColor: s.playerColor,
    }))
  }, [])

  const value = {
    ...state,
    setScreen,
    setPlayerInfo,
    setRoom,
    setPlayers,
    addPlayer,
    updatePlayer,
    removePlayer,
    setMessages,
    addMessage,
    setVotes,
    addVote,
    clearVotes,
    setMeetingId,
    setMyRole,
    setIsAlive,
    reset,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
