"use client"

import { useState } from "react"
import { MAPS, type MapId } from "@/lib/game-data"
import { getColorHex } from "@/lib/supabase"
import { X, MapPin, AlertTriangle, Navigation } from "lucide-react"

type MinimapProps = {
  mapId: MapId
  players: { name: string; color: string; position?: { x: number; y: number }; isAlive: boolean }[]
  currentPlayer: string
  sabotageActive?: { type: string; locations: string[] } | null
  bodies?: { x: number; y: number; color: string }[]
  onClose?: () => void
  expanded?: boolean
}

// Simple room positions for the minimap
const ROOM_POSITIONS: Record<string, Record<string, { x: number; y: number }>> = {
  starship: {
    Cafeteria: { x: 50, y: 15 },
    Medbay: { x: 25, y: 25 },
    "Upper Engine": { x: 15, y: 30 },
    "Lower Engine": { x: 15, y: 70 },
    Security: { x: 30, y: 50 },
    Reactor: { x: 10, y: 50 },
    Electrical: { x: 35, y: 70 },
    Storage: { x: 50, y: 80 },
    Admin: { x: 65, y: 55 },
    Weapons: { x: 85, y: 25 },
    Shields: { x: 85, y: 70 },
    Communications: { x: 75, y: 80 },
    Navigation: { x: 90, y: 50 },
    O2: { x: 65, y: 35 },
  },
  research_lab: {
    Lobby: { x: 50, y: 20 },
    Laboratory: { x: 30, y: 35 },
    Specimen: { x: 70, y: 35 },
    Office: { x: 20, y: 50 },
    Greenhouse: { x: 80, y: 50 },
    "Server Room": { x: 35, y: 65 },
    Cafeteria: { x: 50, y: 50 },
    Decontamination: { x: 65, y: 65 },
    Storage: { x: 15, y: 75 },
    Reactor: { x: 85, y: 75 },
    Medical: { x: 35, y: 85 },
    Launchpad: { x: 65, y: 85 },
  },
  cyber_city: {
    Plaza: { x: 50, y: 20 },
    Market: { x: 30, y: 30 },
    Tower: { x: 70, y: 30 },
    Underground: { x: 20, y: 50 },
    Arcade: { x: 40, y: 50 },
    "Police Station": { x: 60, y: 50 },
    Hospital: { x: 80, y: 50 },
    Factory: { x: 25, y: 70 },
    Docks: { x: 50, y: 70 },
    Penthouse: { x: 75, y: 70 },
    Subway: { x: 35, y: 85 },
    Warehouse: { x: 65, y: 85 },
  },
  desert_outpost: {
    Command: { x: 50, y: 15 },
    Mines: { x: 20, y: 35 },
    Refinery: { x: 80, y: 35 },
    Barracks: { x: 30, y: 55 },
    Garage: { x: 50, y: 45 },
    Workshop: { x: 70, y: 55 },
    "Solar Array": { x: 15, y: 75 },
    "Water Treatment": { x: 50, y: 75 },
    Communications: { x: 85, y: 75 },
    "Landing Pad": { x: 50, y: 90 },
  },
  underwater_base: {
    Airlock: { x: 50, y: 10 },
    "Moon Pool": { x: 30, y: 25 },
    Observation: { x: 70, y: 25 },
    Quarters: { x: 20, y: 45 },
    Lab: { x: 40, y: 45 },
    "Control Room": { x: 60, y: 45 },
    "Cargo Bay": { x: 80, y: 45 },
    "Life Support": { x: 30, y: 65 },
    Generator: { x: 50, y: 65 },
    "Dive Bay": { x: 70, y: 65 },
    "Med Bay": { x: 35, y: 85 },
    Cafeteria: { x: 65, y: 85 },
  },
  sky_fortress: {
    Bridge: { x: 50, y: 10 },
    Hangar: { x: 20, y: 30 },
    Armory: { x: 80, y: 30 },
    Barracks: { x: 30, y: 50 },
    "Engine Room": { x: 50, y: 50 },
    "Observation Deck": { x: 70, y: 50 },
    "Mess Hall": { x: 20, y: 70 },
    "Medical Bay": { x: 40, y: 70 },
    Communications: { x: 60, y: 70 },
    Brig: { x: 80, y: 70 },
    "Training Room": { x: 35, y: 90 },
    "Control Tower": { x: 65, y: 90 },
  },
}

export function Minimap({
  mapId,
  players,
  currentPlayer,
  sabotageActive,
  bodies = [],
  onClose,
  expanded = false,
}: MinimapProps) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null)
  const map = MAPS.find((m) => m.id === mapId) || MAPS[0]
  const rooms = ROOM_POSITIONS[mapId] || ROOM_POSITIONS.starship

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gray-900/95 backdrop-blur-xl ${
        expanded
          ? "fixed inset-4 z-50 border-cyan-500/50"
          : "border-cyan-500/30"
      }`}
      style={{ boxShadow: expanded ? "0 0 60px rgba(0, 255, 255, 0.3)" : undefined }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-300">{map.name.toUpperCase()}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Map area */}
      <div
        className={`relative ${expanded ? "h-[calc(100%-3rem)]" : "h-48"}`}
        style={{ backgroundColor: `${map.color}10` }}
      >
        {/* Rooms */}
        {Object.entries(rooms).map(([roomName, pos]) => {
          const isSabotaged = sabotageActive?.locations.includes(roomName)

          return (
            <div
              key={roomName}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onMouseEnter={() => setHoveredRoom(roomName)}
              onMouseLeave={() => setHoveredRoom(null)}
            >
              {/* Room dot */}
              <div
                className={`h-3 w-3 rounded-full border transition-all ${
                  isSabotaged
                    ? "animate-pulse border-red-500 bg-red-500"
                    : "border-cyan-500/50 bg-cyan-500/30"
                }`}
              />

              {/* Room name tooltip */}
              {(hoveredRoom === roomName || expanded) && (
                <div className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                  {roomName}
                  {isSabotaged && (
                    <AlertTriangle className="ml-1 inline h-3 w-3 text-red-400" />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Vent connections (lines) */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-30">
          {map.vents.map(([from, to], i) => {
            const fromPos = rooms[from]
            const toPos = rooms[to]
            if (!fromPos || !toPos) return null

            return (
              <line
                key={i}
                x1={`${fromPos.x}%`}
                y1={`${fromPos.y}%`}
                x2={`${toPos.x}%`}
                y2={`${toPos.y}%`}
                stroke="#ff00ff"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )
          })}
        </svg>

        {/* Dead bodies */}
        {bodies.map((body, i) => (
          <div
            key={`body-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${body.x}%`, top: `${body.y}%` }}
          >
            <div
              className="h-4 w-3 rotate-90 rounded-full animate-pulse"
              style={{ backgroundColor: getColorHex(body.color), opacity: 0.7 }}
            />
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500" />
          </div>
        ))}

        {/* Players */}
        {players
          .filter((p) => p.isAlive && p.position)
          .map((player) => (
            <div
              key={player.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ left: `${player.position!.x}%`, top: `${player.position!.y}%` }}
            >
              <div
                className="flex h-5 w-4 items-end justify-center rounded-t-full rounded-b-sm"
                style={{
                  backgroundColor: getColorHex(player.color),
                  boxShadow: player.name === currentPlayer ? `0 0 10px ${getColorHex(player.color)}` : undefined,
                  border: player.name === currentPlayer ? "2px solid white" : undefined,
                }}
              >
                <div className="mb-2 h-2 w-2 rounded-sm bg-cyan-200/80" />
              </div>
            </div>
          ))}

        {/* Sabotage warning overlay */}
        {sabotageActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 animate-pulse bg-red-500/10" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center gap-2 rounded-lg bg-red-500/80 px-4 py-2 text-white">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-bold">{sabotageActive.type}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {expanded && (
        <div className="absolute bottom-4 left-4 flex gap-4 rounded-lg bg-black/80 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="text-gray-400">Room</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-4 border-t-2 border-dashed border-magenta-500" />
            <span className="text-gray-400">Vent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-gray-400">Sabotage</span>
          </div>
        </div>
      )}
    </div>
  )
}
