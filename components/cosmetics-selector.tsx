"use client"

import { useState } from "react"
import { HATS, SKINS, COLORS } from "@/lib/supabase"
import { getColorHex, getColorGlow } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Crown, Radio, Flower, HardHat, Circle, Flame, Headphones, Cloud, Box, Wind, Shield, X } from "lucide-react"

const HAT_ICONS: Record<string, React.ElementType> = {
  crown: Crown,
  radio: Radio,
  flower: Flower,
  "hard-hat": HardHat,
  circle: Circle,
  flame: Flame,
  headphones: Headphones,
  cloud: Cloud,
  box: Box,
  wind: Wind,
  shield: Shield,
}

type CosmeticsSelectorProps = {
  selectedColor: string
  selectedHat: string
  selectedSkin: string
  onColorChange: (color: string) => void
  onHatChange: (hat: string) => void
  onSkinChange: (skin: string) => void
  onClose: () => void
}

export function CosmeticsSelector({
  selectedColor,
  selectedHat,
  selectedSkin,
  onColorChange,
  onHatChange,
  onSkinChange,
  onClose,
}: CosmeticsSelectorProps) {
  const [tab, setTab] = useState<"colors" | "hats" | "skins">("colors")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-gray-900/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 p-4">
          <h2
            className="text-2xl font-bold text-cyan-400"
            style={{ textShadow: "0 0 20px #00ffff" }}
          >
            CUSTOMIZE
          </h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Player preview */}
        <div className="flex justify-center py-8">
          <div className="relative">
            {/* Hat */}
            {selectedHat !== "none" && HAT_ICONS[HATS.find((h) => h.id === selectedHat)?.icon || ""] && (
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2"
                style={{ color: getColorHex(selectedColor) }}
              >
                {(() => {
                  const Icon = HAT_ICONS[HATS.find((h) => h.id === selectedHat)?.icon || ""]
                  return Icon ? <Icon className="h-8 w-8" /> : null
                })()}
              </div>
            )}

            {/* Body */}
            <div
              className="flex h-24 w-20 items-end justify-center rounded-t-full rounded-b-lg transition-all"
              style={{
                backgroundColor: getColorHex(selectedColor),
                boxShadow: getColorGlow(selectedColor),
              }}
            >
              <div className="mb-8 h-7 w-12 rounded-sm bg-cyan-200/80" />
            </div>

            {/* Skin indicator */}
            {selectedSkin !== "none" && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-400">
                {SKINS.find((s) => s.id === selectedSkin)?.name}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(["colors", "hats", "skins"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                tab === t
                  ? "border-b-2 border-cyan-400 text-cyan-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto p-4">
          {/* Colors */}
          {tab === "colors" && (
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onColorChange(color.name)}
                  className="group relative flex flex-col items-center gap-1"
                >
                  <div
                    className="h-12 w-12 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: selectedColor === color.name ? color.glow : undefined,
                      border: selectedColor === color.name ? "3px solid white" : "3px solid transparent",
                    }}
                  />
                  <span className="text-xs capitalize text-gray-400 group-hover:text-white">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Hats */}
          {tab === "hats" && (
            <div className="grid grid-cols-4 gap-3">
              {HATS.map((hat) => {
                const Icon = hat.icon ? HAT_ICONS[hat.icon] : null
                return (
                  <button
                    key={hat.id}
                    onClick={() => onHatChange(hat.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                      selectedHat === hat.id
                        ? "border-cyan-400 bg-cyan-500/20"
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}
                  >
                    {Icon ? (
                      <Icon className="h-8 w-8 text-cyan-400" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center text-gray-500">-</div>
                    )}
                    <span className="text-xs text-gray-400">{hat.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Skins */}
          {tab === "skins" && (
            <div className="grid grid-cols-3 gap-3">
              {SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => onSkinChange(skin.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                    selectedSkin === skin.id
                      ? "border-cyan-400 bg-cyan-500/20"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div
                    className="flex h-12 w-10 items-end justify-center rounded-t-full rounded-b-md"
                    style={{ backgroundColor: getColorHex(selectedColor) }}
                  >
                    <div className="mb-4 h-4 w-6 rounded-sm bg-cyan-200/80" />
                  </div>
                  <span className="text-xs text-gray-400">{skin.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <Button
            onClick={onClose}
            className="w-full border-2 border-cyan-500 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/40"
          >
            DONE
          </Button>
        </div>
      </div>
    </div>
  )
}
