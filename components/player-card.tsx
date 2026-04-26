"use client"

import { getColorHex, getColorGlow } from "@/lib/supabase"
import { Crown, Skull, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayerCardProps {
  name: string
  color: string
  isHost?: boolean
  isReady?: boolean
  isAlive?: boolean
  isImpostor?: boolean
  showRole?: boolean
  isCurrentPlayer?: boolean
  isSelected?: boolean
  isVoted?: boolean
  voteCount?: number
  onClick?: () => void
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PlayerCard({
  name,
  color,
  isHost = false,
  isReady = false,
  isAlive = true,
  isImpostor = false,
  showRole = false,
  isCurrentPlayer = false,
  isSelected = false,
  isVoted = false,
  voteCount = 0,
  onClick,
  size = "md",
  className,
}: PlayerCardProps) {
  const colorHex = getColorHex(color)
  const colorGlow = getColorGlow(color)

  const sizeClasses = {
    sm: {
      container: "p-2",
      avatar: "h-10 w-8",
      visor: "h-3 w-5 mb-4",
      name: "text-xs",
      badge: "text-[10px] px-1.5 py-0.5",
      crown: "h-3 w-3",
    },
    md: {
      container: "p-4",
      avatar: "h-16 w-14",
      visor: "h-5 w-8 mb-6",
      name: "text-sm",
      badge: "text-xs px-2 py-0.5",
      crown: "h-5 w-5",
    },
    lg: {
      container: "p-6",
      avatar: "h-24 w-20",
      visor: "h-7 w-12 mb-8",
      name: "text-base",
      badge: "text-sm px-3 py-1",
      crown: "h-6 w-6",
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-xl border bg-black/50 transition-all",
        onClick && "cursor-pointer hover:scale-105",
        isSelected && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-black",
        !isAlive && "opacity-60 grayscale",
        isCurrentPlayer && "border-2 border-yellow-400/50",
        sizes.container,
        className
      )}
      style={{
        borderColor: isReady || isSelected ? colorHex : "rgba(255,255,255,0.1)",
        boxShadow: isReady || isSelected ? colorGlow : undefined,
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick()
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${name}${isHost ? ", host" : ""}${isReady ? ", ready" : ""}${!isAlive ? ", eliminated" : ""}`}
      aria-pressed={isSelected}
    >
      {/* Host crown */}
      {isHost && (
        <Crown
          className={cn("absolute -top-2 right-2 text-yellow-400", sizes.crown)}
          style={{ filter: "drop-shadow(0 0 5px #ffaa00)" }}
          aria-label="Host"
        />
      )}

      {/* Dead indicator */}
      {!isAlive && (
        <Skull
          className="absolute -top-1 left-2 h-4 w-4 text-red-500"
          aria-label="Eliminated"
        />
      )}

      {/* Voted indicator */}
      {isVoted && (
        <CheckCircle2
          className="absolute -top-1 left-2 h-4 w-4 text-green-500"
          aria-label="Has voted"
        />
      )}

      {/* Player Avatar */}
      <div
        className={cn(
          "flex items-end justify-center rounded-t-full rounded-b-lg transition-transform group-hover:scale-105",
          sizes.avatar
        )}
        style={{
          backgroundColor: colorHex,
          boxShadow: colorGlow,
          opacity: isAlive ? 1 : 0.5,
        }}
        aria-hidden="true"
      >
        <div
          className={cn("rounded-sm bg-cyan-200/80", sizes.visor)}
        />
      </div>

      {/* Name */}
      <p
        className={cn(
          "mt-2 max-w-full truncate font-bold text-white",
          sizes.name
        )}
      >
        {name}
        {isCurrentPlayer && <span className="sr-only"> (you)</span>}
      </p>

      {/* Status badges */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
        {/* Ready/Waiting badge */}
        {isAlive && (
          <span
            className={cn("rounded-full font-bold", sizes.badge)}
            style={{
              backgroundColor: isReady
                ? "rgba(0, 255, 0, 0.2)"
                : "rgba(100, 100, 100, 0.3)",
              color: isReady ? "#00ff00" : "#666",
            }}
          >
            {isReady ? "READY" : "WAITING"}
          </span>
        )}

        {/* Role badge (only shown when showRole is true) */}
        {showRole && (
          <span
            className={cn("rounded-full font-bold", sizes.badge)}
            style={{
              backgroundColor: isImpostor
                ? "rgba(255, 0, 0, 0.2)"
                : "rgba(0, 200, 255, 0.2)",
              color: isImpostor ? "#ff4444" : "#00ccff",
            }}
          >
            {isImpostor ? "IMPOSTOR" : "CREW"}
          </span>
        )}

        {/* Vote count */}
        {voteCount > 0 && (
          <span
            className={cn(
              "rounded-full bg-red-500/30 font-bold text-red-400",
              sizes.badge
            )}
          >
            {voteCount} vote{voteCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )
}

// Empty slot placeholder
export function PlayerSlotEmpty({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClasses = {
    sm: {
      container: "p-2",
      avatar: "h-10 w-8",
    },
    md: {
      container: "p-4",
      avatar: "h-16 w-14",
    },
    lg: {
      container: "p-6",
      avatar: "h-24 w-20",
    },
  }

  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-cyan-900/30 bg-black/30",
        sizes.container,
        className
      )}
      aria-label="Empty player slot"
    >
      <div
        className={cn(
          "rounded-t-full rounded-b-lg border-2 border-dashed border-cyan-900/30",
          sizes.avatar
        )}
        aria-hidden="true"
      />
      <p className="mt-2 text-xs text-cyan-900">EMPTY SLOT</p>
    </div>
  )
}
