"use client"

import { useState, useEffect } from "react"
import { ROLES, type RoleId } from "@/lib/game-data"
import { Skull, User, Wrench, Shield, Heart, Terminal, BadgeCheck, Drama, Ghost, Eye, Crosshair, Repeat, Clock, Users } from "lucide-react"

const ROLE_ICONS: Record<string, React.ElementType> = {
  user: User,
  skull: Skull,
  wrench: Wrench,
  shield: Shield,
  heart: Heart,
  terminal: Terminal,
  badge: BadgeCheck,
  mask: Drama,
  ghost: Ghost,
  eye: Eye,
  crosshair: Crosshair,
  repeat: Repeat,
  clock: Clock,
}

type RoleRevealProps = {
  roleId: RoleId
  onComplete: () => void
}

export function RoleReveal({ roleId, onComplete }: RoleRevealProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "abilities" | "done">("intro")
  const role = ROLES.find((r) => r.id === roleId) || ROLES[0]
  const Icon = ROLE_ICONS[role.icon] || User

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("reveal"), 1500),
      setTimeout(() => setPhase("abilities"), 3500),
      setTimeout(() => {
        setPhase("done")
        onComplete()
      }, 6000),
    ]

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${role.color}40 0%, transparent 70%)`,
        }}
      />

      {/* Scanning lines effect */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-full bg-white"
            style={{
              top: `${i * 5}%`,
              animation: `scan 2s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Phase: Intro */}
        {phase === "intro" && (
          <div className="animate-pulse space-y-4">
            <div className="h-2 w-48 animate-pulse rounded bg-gray-700" />
            <p className="text-2xl font-light tracking-widest text-gray-400">ANALYZING DNA...</p>
            <div className="flex justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-3 animate-bounce rounded-full"
                  style={{ backgroundColor: role.color, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Phase: Reveal */}
        {(phase === "reveal" || phase === "abilities" || phase === "done") && (
          <div className="space-y-8">
            {/* Icon with glow */}
            <div
              className="animate-in zoom-in-50 duration-700 mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4"
              style={{
                borderColor: role.color,
                backgroundColor: `${role.color}20`,
                boxShadow: role.glow,
              }}
            >
              <Icon className="h-16 w-16" style={{ color: role.color }} />
            </div>

            {/* Role name */}
            <h1
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-6xl font-black tracking-wider"
              style={{
                color: role.color,
                textShadow: `0 0 60px ${role.color}, 0 0 120px ${role.color}`,
              }}
            >
              {role.name.toUpperCase()}
            </h1>

            {/* Team badge */}
            <div
              className="animate-in fade-in duration-700 delay-300 inline-block rounded-full px-6 py-2"
              style={{
                backgroundColor: `${role.color}30`,
                border: `2px solid ${role.color}`,
              }}
            >
              <span className="text-lg font-bold tracking-widest" style={{ color: role.color }}>
                {role.team.toUpperCase()} TEAM
              </span>
            </div>
          </div>
        )}

        {/* Phase: Abilities */}
        {(phase === "abilities" || phase === "done") && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200 mt-12 max-w-md space-y-6">
            {/* Description */}
            <p className="text-lg text-gray-300">{role.description}</p>

            {/* Abilities list */}
            <div className="flex flex-wrap justify-center gap-3">
              {role.abilities.map((ability, i) => (
                <div
                  key={ability}
                  className="animate-in fade-in zoom-in-95 rounded-lg border px-4 py-2"
                  style={{
                    borderColor: `${role.color}50`,
                    backgroundColor: `${role.color}10`,
                    animationDelay: `${i * 100}ms`,
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: role.color }}>
                    {ability}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={onComplete}
          className="mt-12 text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          CLICK TO CONTINUE
        </button>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  )
}
