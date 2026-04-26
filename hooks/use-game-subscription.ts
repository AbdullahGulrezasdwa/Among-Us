"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type SubscriptionStatus = "connecting" | "connected" | "disconnected" | "error"

interface UseGameSubscriptionOptions<T> {
  table: string
  filter?: string
  filterValue?: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  onInsert?: (payload: T) => void
  onUpdate?: (payload: T, oldPayload?: T) => void
  onDelete?: (payload: T) => void
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void
  enabled?: boolean
}

interface UseGameSubscriptionReturn {
  status: SubscriptionStatus
  error: Error | null
  reconnect: () => void
}

export function useGameSubscription<T extends Record<string, unknown>>({
  table,
  filter,
  filterValue,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseGameSubscriptionOptions<T>): UseGameSubscriptionReturn {
  const [status, setStatus] = useState<SubscriptionStatus>("disconnected")
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = useRef(1000)

  // Keep callbacks in refs to avoid re-subscribing on every render
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
    onChangeRef.current = onChange
  }, [onInsert, onUpdate, onDelete, onChange])

  const subscribe = useCallback(() => {
    if (!enabled) return

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    setStatus("connecting")
    setError(null)

    const channelName = `${table}-${filter || "all"}-${filterValue || "all"}-${Date.now()}`
    
    // Build filter configuration
    const filterConfig: {
      event: "INSERT" | "UPDATE" | "DELETE" | "*"
      schema: string
      table: string
      filter?: string
    } = {
      event,
      schema: "public",
      table,
    }

    if (filter && filterValue) {
      filterConfig.filter = `${filter}=eq.${filterValue}`
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        filterConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          // Reset reconnect state on successful message
          reconnectAttempts.current = 0
          reconnectDelay.current = 1000

          if (onChangeRef.current) {
            onChangeRef.current(payload)
          }

          switch (payload.eventType) {
            case "INSERT":
              if (onInsertRef.current) {
                onInsertRef.current(payload.new as T)
              }
              break
            case "UPDATE":
              if (onUpdateRef.current) {
                onUpdateRef.current(payload.new as T, payload.old as T)
              }
              break
            case "DELETE":
              if (onDeleteRef.current) {
                onDeleteRef.current(payload.old as T)
              }
              break
          }
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("connected")
          reconnectAttempts.current = 0
          reconnectDelay.current = 1000
        } else if (subscriptionStatus === "CHANNEL_ERROR") {
          setStatus("error")
          setError(new Error("Channel subscription error"))
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            setTimeout(() => {
              reconnectAttempts.current++
              reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000)
              subscribe()
            }, reconnectDelay.current)
          }
        } else if (subscriptionStatus === "CLOSED") {
          setStatus("disconnected")
        }
      })

    channelRef.current = channel
  }, [enabled, table, filter, filterValue, event])

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0
    reconnectDelay.current = 1000
    subscribe()
  }, [subscribe])

  useEffect(() => {
    subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [subscribe])

  return {
    status,
    error,
    reconnect,
  }
}

// Specialized hook for game state
export function useGameStateSubscription(
  gameCode: string,
  onUpdate: (game: Record<string, unknown>) => void,
  enabled = true
) {
  return useGameSubscription({
    table: "games",
    filter: "code",
    filterValue: gameCode,
    event: "UPDATE",
    onUpdate,
    enabled,
  })
}

// Specialized hook for players in a game
export function usePlayersSubscription(
  gameId: string,
  callbacks: {
    onJoin?: (player: Record<string, unknown>) => void
    onUpdate?: (player: Record<string, unknown>) => void
    onLeave?: (player: Record<string, unknown>) => void
  },
  enabled = true
) {
  return useGameSubscription({
    table: "players",
    filter: "game_id",
    filterValue: gameId,
    onInsert: callbacks.onJoin,
    onUpdate: callbacks.onUpdate,
    onDelete: callbacks.onLeave,
    enabled,
  })
}

// Specialized hook for chat messages
export function useChatSubscription(
  gameId: string,
  onNewMessage: (message: Record<string, unknown>) => void,
  enabled = true
) {
  return useGameSubscription({
    table: "chat_messages",
    filter: "game_id",
    filterValue: gameId,
    event: "INSERT",
    onInsert: onNewMessage,
    enabled,
  })
}
