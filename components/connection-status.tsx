"use client"

import { useConnectionStatus } from "@/hooks/use-connection-status"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  className?: string
  showLabel?: boolean
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "inline"
}

export function ConnectionStatus({
  className,
  showLabel = true,
  position = "top-right",
}: ConnectionStatusProps) {
  const { status, isOnline, isOffline, isReconnecting } = useConnectionStatus()

  // Don't show anything when online and stable
  if (isOnline) {
    return null
  }

  const positionClasses = {
    "top-left": "fixed top-4 left-4 z-50",
    "top-right": "fixed top-4 right-4 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
    "bottom-right": "fixed bottom-4 right-4 z-50",
    inline: "",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm",
        isOffline && "bg-red-500/20 border border-red-500/40",
        isReconnecting && "bg-yellow-500/20 border border-yellow-500/40",
        positionClasses[position],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isOffline && (
        <>
          <WifiOff className="w-4 h-4 text-red-400" aria-hidden="true" />
          {showLabel && (
            <span className="text-sm font-medium text-red-400">
              No connection
            </span>
          )}
        </>
      )}

      {isReconnecting && (
        <>
          <RefreshCw
            className="w-4 h-4 text-yellow-400 animate-spin"
            aria-hidden="true"
          />
          {showLabel && (
            <span className="text-sm font-medium text-yellow-400">
              Reconnecting...
            </span>
          )}
        </>
      )}
      
      <span className="sr-only">
        {status === "offline"
          ? "You are offline. Some features may not work."
          : status === "reconnecting"
            ? "Attempting to reconnect to the server."
            : "Connected to the server."}
      </span>
    </div>
  )
}

// Inline connection indicator for headers/status bars
export function ConnectionIndicator({ className }: { className?: string }) {
  const { status } = useConnectionStatus()

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-label={`Connection status: ${status}`}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          status === "online" && "bg-green-500",
          status === "offline" && "bg-red-500",
          status === "reconnecting" && "bg-yellow-500 animate-pulse"
        )}
      />
      <span className="text-xs text-muted-foreground capitalize">{status}</span>
    </div>
  )
}
