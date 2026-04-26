"use client"

import { useState } from "react"
import { useGame } from "@/lib/game-store"
import { createClient, generateRoomCode, COLORS, getColorHex, getColorGlow } from "@/lib/supabase"
import { MAPS, HATS, SKINS } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CosmeticsSelector } from "@/components/cosmetics-selector"
import { Sparkles, Users, Play, Zap, Palette, Volume2 } from "lucide-react"

export function HomeScreen() {
  const game = useGame()
  const [name, setName] = useState(game.playerName || "")
  const [color, setColor] = useState(game.playerColor || "cyan")
  const [hat, setHat] = useState("none")
  const [skin, setSkin] = useState("none")
  const [joinCode, setJoinCode] = useState("")
  const [selectedMap, setSelectedMap] = useState("starship")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showCosmetics, setShowCosmetics] = useState(false)

  const supabase = createClient()

  async function handleCreate() {
    if (!name.trim()) {
      setError("Enter your name, crewmate!")
      return
    }
    setLoading(true)
    setError("")

    try {
      const code = generateRoomCode()
      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .insert({ code, host_id: game.playerId, map: selectedMap })
        .select()
        .single()

      if (roomErr) throw roomErr

      const { error: playerErr } = await supabase.from("players").insert({
        room_id: room.id,
        player_id: game.playerId,
        name: name.trim(),
        color,
        is_host: true,
      })

      if (playerErr) throw playerErr

      game.setPlayerInfo(name.trim(), color)
      game.setRoom(room)
      game.setScreen("lobby")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!name.trim()) {
      setError("Enter your name, crewmate!")
      return
    }
    if (!joinCode.trim()) {
      setError("Enter a room code!")
      return
    }
    setLoading(true)
    setError("")

    try {
      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .select()
        .eq("code", joinCode.toUpperCase())
        .single()

      if (roomErr || !room) {
        setError("Room not found!")
        setLoading(false)
        return
      }

      if (room.status !== "lobby") {
        setError("Game already in progress!")
        setLoading(false)
        return
      }

      const { data: existingPlayers } = await supabase
        .from("players")
        .select("color")
        .eq("room_id", room.id)

      const takenColors = existingPlayers?.map((p) => p.color) || []
      let finalColor = color
      if (takenColors.includes(color)) {
        const available = COLORS.find((c) => !takenColors.includes(c.name))
        finalColor = available?.name || color
      }

      const { error: playerErr } = await supabase.from("players").insert({
        room_id: room.id,
        player_id: game.playerId,
        name: name.trim(),
        color: finalColor,
      })

      if (playerErr) throw playerErr

      game.setPlayerInfo(name.trim(), finalColor)
      game.setRoom(room)
      game.setScreen("lobby")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join room")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Animated Title */}
        <div className="text-center">
          <div className="relative inline-block">
            <h1
              className="animate-pulse text-7xl font-black tracking-tighter"
              style={{
                textShadow: "0 0 40px #00ffff, 0 0 80px #00ffff, 0 0 120px #ff00ff",
                color: "#00ffff",
              }}
            >
              NEON
            </h1>
            <Sparkles className="absolute -right-8 top-0 h-8 w-8 animate-spin text-yellow-400" style={{ animationDuration: "3s" }} />
          </div>
          <h2
            className="text-5xl font-black tracking-wider"
            style={{
              textShadow: "0 0 30px #ff00ff, 0 0 60px #ff00ff",
              color: "#ff00ff",
            }}
          >
            IMPOSTOR
          </h2>
          <p className="mt-3 text-cyan-300/60">
            <Zap className="mr-1 inline h-4 w-4" />
            Real-time multiplayer social deduction
          </p>
        </div>

        {/* Player Setup Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-black/70 p-6 backdrop-blur-xl" style={{ boxShadow: "0 0 40px rgba(0, 255, 255, 0.1)" }}>
          <div className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
                <Users className="h-4 w-4" />
                Your Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter crewmate name..."
                maxLength={16}
                className="h-12 border-cyan-500/50 bg-black/50 text-lg text-cyan-100 placeholder:text-cyan-700 focus:border-cyan-400 focus:ring-cyan-400/30"
              />
            </div>

            {/* Color & Cosmetics Row */}
            <div className="flex gap-4">
              {/* Quick Color Picker */}
              <div className="flex-1">
                <label className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
                  <Palette className="h-4 w-4" />
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className="h-10 w-10 rounded-full transition-all hover:scale-110"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: color === c.name ? c.glow : "none",
                        border: color === c.name ? "3px solid white" : "3px solid transparent",
                      }}
                    />
                  ))}
                  <button
                    onClick={() => setShowCosmetics(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-cyan-500/50 text-cyan-500 transition-all hover:border-cyan-400 hover:text-cyan-400"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Map Selection */}
            <div>
              <label className="mb-2 block text-sm text-cyan-300">Select Map</label>
              <div className="grid grid-cols-3 gap-2">
                {MAPS.slice(0, 6).map((map) => (
                  <button
                    key={map.id}
                    onClick={() => setSelectedMap(map.id)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      selectedMap === map.id
                        ? "border-cyan-400 bg-cyan-500/20"
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                    }`}
                  >
                    <div className="mb-1 text-2xl" style={{ color: map.color }}>
                      {map.id === "starship" && "🚀"}
                      {map.id === "research_lab" && "🔬"}
                      {map.id === "cyber_city" && "🌃"}
                      {map.id === "desert_outpost" && "🏜️"}
                      {map.id === "underwater_base" && "🌊"}
                      {map.id === "sky_fortress" && "☁️"}
                    </div>
                    <span className="text-xs text-gray-400">{map.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="h-14 w-full border-2 border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-lg font-bold text-cyan-100 transition-all hover:from-cyan-500/40 hover:to-blue-500/40 hover:shadow-[0_0_40px_#00ffff]"
              >
                <Play className="mr-2 h-5 w-5" />
                {loading ? "CREATING..." : "CREATE GAME"}
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <span className="text-xs text-cyan-500">OR JOIN</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="flex gap-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  className="h-12 flex-1 border-[#ff00ff]/50 bg-black/50 text-center font-mono text-xl tracking-widest text-[#ff00ff] placeholder:text-[#ff00ff]/30"
                />
                <Button
                  onClick={handleJoin}
                  disabled={loading}
                  className="h-12 border-2 border-[#ff00ff] bg-[#ff00ff]/20 px-6 text-[#ff00ff] transition-all hover:bg-[#ff00ff]/40 hover:shadow-[0_0_30px_#ff00ff]"
                >
                  JOIN
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-red-400" style={{ textShadow: "0 0 10px #ff0033" }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Player Preview */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Hat preview */}
            {hat !== "none" && (
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl"
                style={{ filter: `drop-shadow(0 0 10px ${getColorHex(color)})` }}
              >
                {hat === "crown" && "👑"}
                {hat === "antenna" && "📡"}
                {hat === "flower" && "🌸"}
                {hat === "halo" && "😇"}
              </div>
            )}

            {/* Player body */}
            <div
              className="flex h-24 w-20 items-end justify-center rounded-t-full rounded-b-lg transition-all"
              style={{
                backgroundColor: getColorHex(color),
                boxShadow: getColorGlow(color),
              }}
            >
              <div className="mb-8 h-7 w-12 rounded-sm bg-cyan-200/90" />
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-400">
            {name || "Your crewmate"}
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Volume2 className="h-3 w-3" />
            Voice Chat
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            10 Players
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            14 Roles
          </div>
        </div>
      </div>

      {/* Cosmetics Modal */}
      {showCosmetics && (
        <CosmeticsSelector
          selectedColor={color}
          selectedHat={hat}
          selectedSkin={skin}
          onColorChange={setColor}
          onHatChange={setHat}
          onSkinChange={setSkin}
          onClose={() => setShowCosmetics(false)}
        />
      )}
    </div>
  )
}
