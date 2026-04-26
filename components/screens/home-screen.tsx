"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useGame } from "@/lib/game-store"
import { createClient, generateRoomCode, COLORS, getColorHex, getColorGlow } from "@/lib/supabase"
import { MAPS } from "@/lib/game-data"
import { validatePlayerName, validateRoomCode } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CosmeticsSelector } from "@/components/cosmetics-selector"
import { Spinner } from "@/components/ui/spinner"
import { Sparkles, Users, Play, Zap, Palette, Volume2, Loader2 } from "lucide-react"

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
    const nameValidation = validatePlayerName(name)
    if (!nameValidation.success) {
      const errorMessage = nameValidation.error.errors[0]?.message || "Invalid name"
      setError(errorMessage)
      toast.error(errorMessage)
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
        name: nameValidation.data,
        color,
        is_host: true,
      })

      if (playerErr) throw playerErr

      game.setPlayerInfo(nameValidation.data, color)
      game.setRoom(room)
      toast.success(`Room ${code} created!`)
      game.setScreen("lobby")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create room"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    const nameValidation = validatePlayerName(name)
    if (!nameValidation.success) {
      const errorMessage = nameValidation.error.errors[0]?.message || "Invalid name"
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    
    const codeValidation = validateRoomCode(joinCode)
    if (!codeValidation.success) {
      const errorMessage = codeValidation.error.errors[0]?.message || "Invalid room code"
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }
    
    setLoading(true)
    setError("")

    try {
      const { data: room, error: roomErr } = await supabase
        .from("rooms")
        .select()
        .eq("code", codeValidation.data)
        .single()

      if (roomErr || !room) {
        setError("Room not found!")
        toast.error("Room not found!")
        setLoading(false)
        return
      }

      if (room.status !== "lobby") {
        setError("Game already in progress!")
        toast.error("Game already in progress!")
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
        if (finalColor !== color) {
          toast.info(`Your color was taken. Changed to ${finalColor}`)
        }
      }

      const { error: playerErr } = await supabase.from("players").insert({
        room_id: room.id,
        player_id: game.playerId,
        name: nameValidation.data,
        color: finalColor,
      })

      if (playerErr) throw playerErr

      game.setPlayerInfo(nameValidation.data, finalColor)
      game.setRoom(room)
      toast.success(`Joined room ${codeValidation.data}!`)
      game.setScreen("lobby")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to join room"
      setError(errorMessage)
      toast.error(errorMessage)
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
              <label htmlFor="player-name" className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
                <Users className="h-4 w-4" aria-hidden="true" />
                Your Name
              </label>
              <Input
                id="player-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter crewmate name..."
                maxLength={16}
                autoComplete="username"
                className="h-12 border-cyan-500/50 bg-black/50 text-lg text-cyan-100 placeholder:text-cyan-700 focus:border-cyan-400 focus:ring-cyan-400/30"
                aria-describedby={error ? "name-error" : undefined}
              />
            </div>

            {/* Color & Cosmetics Row */}
            <div className="flex gap-4">
              {/* Quick Color Picker */}
              <fieldset className="flex-1">
                <legend className="mb-2 flex items-center gap-2 text-sm text-cyan-300">
                  <Palette className="h-4 w-4" aria-hidden="true" />
                  Color
                </legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select player color">
                  {COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className="h-10 w-10 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: color === c.name ? c.glow : "none",
                        border: color === c.name ? "3px solid white" : "3px solid transparent",
                      }}
                      aria-label={c.name}
                      aria-pressed={color === c.name}
                      role="radio"
                      aria-checked={color === c.name}
                    />
                  ))}
                  <button
                    onClick={() => setShowCosmetics(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-cyan-500/50 text-cyan-500 transition-all hover:border-cyan-400 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    aria-label="More colors and cosmetics"
                  >
                    +
                  </button>
                </div>
              </fieldset>
            </div>

            {/* Map Selection */}
            <fieldset>
              <legend className="mb-2 block text-sm text-cyan-300">Select Map</legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select game map">
                {MAPS.slice(0, 6).map((map) => (
                  <button
                    key={map.id}
                    onClick={() => setSelectedMap(map.id)}
                    className={`rounded-lg border p-3 text-center transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      selectedMap === map.id
                        ? "border-cyan-400 bg-cyan-500/20"
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                    }`}
                    aria-pressed={selectedMap === map.id}
                    role="radio"
                    aria-checked={selectedMap === map.id}
                    aria-label={map.name}
                  >
                    <div className="mb-1 text-2xl" style={{ color: map.color }} aria-hidden="true">
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
            </fieldset>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="h-14 w-full border-2 border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-lg font-bold text-cyan-100 transition-all hover:from-cyan-500/40 hover:to-blue-500/40 hover:shadow-[0_0_40px_#00ffff] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>CREATING...</span>
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                    <span>CREATE GAME</span>
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <span className="text-xs text-cyan-500">OR JOIN</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="flex gap-2">
                <Input
                  id="room-code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  autoComplete="off"
                  aria-label="Room code"
                  className="h-12 flex-1 border-[#ff00ff]/50 bg-black/50 text-center font-mono text-xl tracking-widest text-[#ff00ff] placeholder:text-[#ff00ff]/30"
                />
                <Button
                  onClick={handleJoin}
                  disabled={loading}
                  className="h-12 border-2 border-[#ff00ff] bg-[#ff00ff]/20 px-6 text-[#ff00ff] transition-all hover:bg-[#ff00ff]/40 hover:shadow-[0_0_30px_#ff00ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-busy={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "JOIN"}
                </Button>
              </div>
            </div>

            {error && (
              <p 
                id="name-error"
                className="text-center text-sm text-red-400" 
                style={{ textShadow: "0 0 10px #ff0033" }}
                role="alert"
                aria-live="polite"
              >
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
