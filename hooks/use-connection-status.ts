"use client"

import { useState, useEffect, useCallback } from "react"

type ConnectionStatus = "online" | "offline" | "reconnecting"

interface UseConnectionStatusReturn {
  status: ConnectionStatus
  isOnline: boolean
  isOffline: boolean
  isReconnecting: boolean
  lastOnline: Date | null
}

export function useConnectionStatus(): UseConnectionStatusReturn {
  const [status, setStatus] = useState<ConnectionStatus>("online")
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  const handleOnline = useCallback(() => {
    setStatus("online")
    setLastOnline(new Date())
  }, [])

  const handleOffline = useCallback(() => {
    setLastOnline(new Date())
    setStatus("offline")
  }, [])

  useEffect(() => {
    // Set initial status
    if (typeof window !== "undefined") {
      setStatus(navigator.onLine ? "online" : "offline")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Check for reconnecting state - when we're online but potentially unstable
  useEffect(() => {
    if (status === "offline") {
      const checkConnection = setInterval(() => {
        if (navigator.onLine) {
          setStatus("reconnecting")
          // Attempt a small fetch to verify connection
          fetch("/api/health", { method: "HEAD" })
            .then(() => {
              setStatus("online")
              setLastOnline(new Date())
            })
            .catch(() => {
              setStatus("offline")
            })
        }
      }, 3000)

      return () => clearInterval(checkConnection)
    }
  }, [status])

  return {
    status,
    isOnline: status === "online",
    isOffline: status === "offline",
    isReconnecting: status === "reconnecting",
    lastOnline,
  }
}
