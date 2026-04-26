"use client"

import { useState } from "react"
import { SABOTAGES, MAPS, type MapId } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { X, AlertTriangle, Zap, Wind, WifiOff, Lock, Flame, Droplet, Radio, Shield } from "lucide-react"

const SABOTAGE_ICONS: Record<string, React.ElementType> = {
  "alert-triangle": AlertTriangle,
  "zap-off": Zap,
  wind: Wind,
  "wifi-off": WifiOff,
  lock: Lock,
  flame: Flame,
  droplet: Droplet,
  radio: Radio,
  shield: Shield,
}

type SabotagePanelProps = {
  mapId: MapId
  onSabotage: (sabotageId: string) => void
  onClose: () => void
  cooldown: number
  disabled?: boolean
}

export function SabotagePanel({ mapId, onSabotage, onClose, cooldown, disabled }: SabotagePanelProps) {
  const [selectedSabotage, setSelectedSabotage] = useState<string | null>(null)
  const map = MAPS.find((m) => m.id === mapId) || MAPS[0]

  // Get sabotages available for this map
  const availableSabotages = SABOTAGES.filter((s) =>
    map.sabotages.some((ms) => ms.toLowerCase().includes(s.id.toLowerCase()) || s.name.toLowerCase().includes(ms.toLowerCase()))
  )

  const handleConfirm = () => {
    if (selectedSabotage && !disabled && cooldown === 0) {
      onSabotage(selectedSabotage)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-red-500/50 bg-gray-900/95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/30 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2
              className="text-2xl font-black text-red-500"
              style={{ textShadow: "0 0 20px #ff0033" }}
            >
              SABOTAGE
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Map name */}
        <div className="border-b border-gray-700 px-4 py-2">
          <span className="text-sm text-gray-400">MAP: </span>
          <span className="font-bold" style={{ color: map.color }}>
            {map.name}
          </span>
        </div>

        {/* Cooldown warning */}
        {cooldown > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-center">
            <span className="font-bold text-orange-400">COOLDOWN: {cooldown}s</span>
          </div>
        )}

        {/* Sabotage options */}
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {availableSabotages.map((sabotage) => {
            const Icon = SABOTAGE_ICONS[sabotage.icon] || AlertTriangle
            const isSelected = selectedSabotage === sabotage.id
            const isDisabled = disabled || cooldown > 0

            return (
              <button
                key={sabotage.id}
                onClick={() => !isDisabled && setSelectedSabotage(sabotage.id)}
                disabled={isDisabled}
                className={`group relative flex flex-col rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-red-500 bg-red-500/20"
                    : isDisabled
                      ? "border-gray-700 bg-gray-800/50 opacity-50"
                      : "border-gray-700 bg-gray-800 hover:border-red-500/50"
                }`}
              >
                {/* Critical badge */}
                {sabotage.critical && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    CRITICAL
                  </div>
                )}

                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${sabotage.color}20`,
                      border: `2px solid ${sabotage.color}50`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: sabotage.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{sabotage.name}</h3>
                    {sabotage.timer && (
                      <span className="text-xs text-red-400">{sabotage.timer}s to fix</span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-400">{sabotage.description}</p>

                {sabotage.locations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sabotage.locations.map((loc) => (
                      <span
                        key={loc}
                        className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-700 p-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-400 hover:text-white"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSabotage || cooldown > 0 || disabled}
            className="flex-1 border-2 border-red-500 bg-red-500/20 text-red-400 transition-all hover:bg-red-500/40 hover:shadow-[0_0_30px_#ff0033] disabled:opacity-50"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            SABOTAGE
          </Button>
        </div>
      </div>
    </div>
  )
}
