"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { useGame } from "@/lib/game-store"
import { createClient, getColorHex, getColorGlow, type Player, type Message } from "@/lib/supabase"
import { MAPS, DEFAULT_SETTINGS } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VoiceChatPanel } from "@/components/voice-chat-panel"
import { Minimap } from "@/components/minimap"
import { CosmeticsSelector } from "@/components/cosmetics-selector"
import { ErrorBoundary } from "@/components/error-boundary"
import { ConnectionStatus } from "@/components/connection-status"
import { Crown, Copy, Check, Settings, Users, MessageSquare, Map, Palette, Play, LogOut, Sparkles, Loader2 } from "lucide-react"

export function LobbyScreen() {
  const game = useGame()
  const supabase = createClient()
  const [chatInput, setChatInput] = useState("")
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCosmetics, setShowCosmetics] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const chatRef = useRef<HTMLDivElement>(null)

  const isHost = game.players.find((p) => p.player_id === game.playerId)?.is_host
  const map = MAPS.find((m) => m.id === game.room?.map) || MAPS[0]

  // Subscribe to realtime updates
  useEffect(() => {
    if (!game.room) return

    supabase
      .from("players")
      .select("*")
      .eq("room_id", game.room.id)
      .then(({ data }) => {
        if (data) game.setPlayers(data)
      })

    supabase
      .from("messages")
      .select("*")
      .eq("room_id", game.room.id)
      .eq("channel", "lobby")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) game.setMessages(data)
      })

    const playersChannel = supabase
      .channel(`players:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${game.room.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            game.addPlayer(payload.new as Player)
          } else if (payload.eventType === "UPDATE") {
            game.updatePlayer((payload.new as Player).player_id, payload.new as Partial<Player>)
          } else if (payload.eventType === "DELETE") {
            game.removePlayer((payload.old as Player).player_id)
          }
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel(`messages:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${game.room.id}` },
        (payload) => {
          const msg = payload.new as Message
          if (msg.channel === "lobby") {
            game.addMessage(msg)
          }
        }
      )
      .subscribe()

    const roomChannel = supabase
      .channel(`room:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${game.room.id}` },
        (payload) => {
          const updated = payload.new as typeof game.room
          game.setRoom(updated)
          if (updated?.status === "playing") {
            supabase
              .from("players")
              .select("role, is_alive")
              .eq("room_id", game.room!.id)
              .eq("player_id", game.playerId)
              .single()
              .then(({ data }) => {
                if (data) {
                  game.setMyRole(data.role as "crew" | "impostor")
                  game.setIsAlive(data.is_alive)
                }
                game.setScreen("game")
              })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(roomChannel)
    }
  }, [game.room?.id])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [game.messages])

  async function handleReady() {
    if (!game.room) return
    const me = game.players.find((p) => p.player_id === game.playerId)
    if (!me) return

    await supabase
      .from("players")
      .update({ is_ready: !me.is_ready })
      .eq("room_id", game.room.id)
      .eq("player_id", game.playerId)
  }

  async function handleStart() {
    if (!game.room || !isHost) return
    if (game.players.length < 4) {
      toast.error("Need at least 4 players to start!")
      return
    }

    setStarting(true)
    toast.loading("Starting game...", { id: "game-start" })

    try {
      const playerIds = game.players.map((p) => p.player_id)
      const impostorCount = Math.min(settings.impostors, Math.floor(game.players.length / 3))
      const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
      const impostors = shuffled.slice(0, impostorCount)

      for (const pid of playerIds) {
        const { error } = await supabase
          .from("players")
          .update({
            role: impostors.includes(pid) ? "impostor" : "crew",
            tasks_total: settings.shortTasks + settings.longTasks,
            tasks_done: 0,
          })
          .eq("room_id", game.room.id)
          .eq("player_id", pid)
        
        if (error) throw error
      }

      const { error: roomError } = await supabase.from("rooms").update({ status: "playing" }).eq("id", game.room.id)
      if (roomError) throw roomError
      
      toast.success("Game started!", { id: "game-start" })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start game"
      toast.error(errorMessage, { id: "game-start" })
    } finally {
      setStarting(false)
    }
  }

  async function handleSendChat() {
    if (!chatInput.trim() || !game.room) return

    await supabase.from("messages").insert({
      room_id: game.room.id,
      player_id: game.playerId,
      name: game.playerName,
      color: game.playerColor,
      body: chatInput.trim(),
      channel: "lobby",
    })

    setChatInput("")
  }

  async function handleLeave() {
    if (!game.room) return

    try {
      await supabase.from("players").delete().eq("room_id", game.room.id).eq("player_id", game.playerId)

      if (isHost) {
        await supabase.from("rooms").delete().eq("id", game.room.id)
      }

      toast.success("Left the room")
      game.reset()
      game.setScreen("home")
    } catch (err) {
      toast.error("Failed to leave room")
    }
  }

  function handleCopyCode() {
    if (game.room?.code) {
      navigator.clipboard.writeText(game.room.code)
        .then(() => {
          setCopied(true)
          toast.success("Room code copied!")
          setTimeout(() => setCopied(false), 2000)
        })
        .catch(() => {
          toast.error("Failed to copy code")
        })
    }
  }

  const readyCount = game.players.filter((p) => p.is_ready).length
  const allReady = readyCount === game.players.length && game.players.length >= 4

  return (
    <ErrorBoundary>
      <ConnectionStatus />
    <div className="flex min-h-screen flex-col p-4 lg:flex-row lg:gap-6">
      {/* Left Panel - Room Info & Players */}
      <div className="flex-1 space-y-4">
        {/* Room Header */}
        <div className="rounded-xl border border-cyan-500/30 bg-black/70 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-sm text-cyan-400">
                <Sparkles className="h-4 w-4" />
                ROOM CODE
              </p>
              <div className="flex items-center gap-3">
                <p
                  className="font-mono text-5xl font-black tracking-widest text-cyan-100"
                  style={{ textShadow: "0 0 30px #00ffff" }}
                >
                  {game.room?.code}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-2 text-cyan-400 transition-all hover:bg-cyan-500/20"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Map Preview */}
              <div className="text-center">
                <div
                  className="mb-1 text-3xl"
                  style={{ filter: `drop-shadow(0 0 10px ${map.color})` }}
                >
                  {map.id === "starship" && "🚀"}
                  {map.id === "research_lab" && "🔬"}
                  {map.id === "cyber_city" && "🌃"}
                  {map.id === "desert_outpost" && "🏜️"}
                  {map.id === "underwater_base" && "🌊"}
                  {map.id === "sky_fortress" && "☁️"}
                </div>
                <p className="text-sm font-bold" style={{ color: map.color }}>
                  {map.name}
                </p>
              </div>

              {/* Settings button (host only) */}
              {isHost && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded-lg border border-gray-600 bg-gray-800 p-3 text-gray-400 transition-all hover:border-cyan-500 hover:text-cyan-400"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="rounded-xl border border-cyan-500/30 bg-black/70 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-cyan-300">
              <Users className="h-5 w-5" />
              CREWMATES ({game.players.length}/{settings.maxPlayers})
            </h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-lime-500 to-green-400 transition-all"
                  style={{ width: `${(readyCount / game.players.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-lime-400">
                {readyCount}/{game.players.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {game.players.map((player) => (
              <div
                key={player.player_id}
                className="group relative flex flex-col items-center rounded-xl border bg-black/50 p-4 transition-all"
                style={{
                  borderColor: player.is_ready ? getColorHex(player.color) : "rgba(255,255,255,0.1)",
                  boxShadow: player.is_ready ? getColorGlow(player.color) : undefined,
                }}
              >
                {/* Host crown */}
                {player.is_host && (
                  <Crown
                    className="absolute -top-2 right-2 h-5 w-5 text-yellow-400"
                    style={{ filter: "drop-shadow(0 0 5px #ffaa00)" }}
                  />
                )}

                {/* Player Avatar */}
                <div
                  className="mb-3 flex h-16 w-14 items-end justify-center rounded-t-full rounded-b-lg transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: getColorHex(player.color),
                    boxShadow: getColorGlow(player.color),
                  }}
                >
                  <div className="mb-6 h-5 w-8 rounded-sm bg-cyan-200/80" />
                </div>

                <p className="max-w-full truncate text-sm font-bold text-white">
                  {player.name}
                </p>

                <span
                  className="mt-1 rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: player.is_ready ? "rgba(0, 255, 0, 0.2)" : "rgba(100, 100, 100, 0.3)",
                    color: player.is_ready ? "#00ff00" : "#666",
                  }}
                >
                  {player.is_ready ? "READY" : "WAITING"}
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: settings.maxPlayers - game.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cyan-900/30 bg-black/30 p-4"
              >
                <div className="mb-3 h-16 w-14 rounded-t-full rounded-b-lg border-2 border-dashed border-cyan-900/30" />
                <p className="text-xs text-cyan-900">EMPTY SLOT</p>
              </div>
            ))}
          </div>
        </div>

        {/* Minimap Preview */}
        <div className="rounded-xl border border-cyan-500/30 bg-black/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-cyan-500/20 px-4 py-3">
            <Map className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-300">MAP PREVIEW</span>
          </div>
          <div className="p-2">
            <Minimap
              mapId={map.id}
              players={game.players.map((p) => ({
                name: p.name,
                color: p.color,
                isAlive: true,
              }))}
              currentPlayer={game.playerName}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleLeave}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            LEAVE
          </Button>

          <Button
            onClick={() => setShowCosmetics(true)}
            variant="outline"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
          >
            <Palette className="mr-2 h-4 w-4" />
            CUSTOMIZE
          </Button>

          <Button
            onClick={handleReady}
            className="flex-1 border-2 border-lime-500 bg-lime-500/20 text-lime-100 transition-all hover:bg-lime-500/40 hover:shadow-[0_0_30px_#00ff00]"
          >
            {game.players.find((p) => p.player_id === game.playerId)?.is_ready
              ? "✓ READY"
              : "READY UP"}
          </Button>

          {isHost && (
            <Button
              onClick={handleStart}
              disabled={!allReady || starting}
              className="flex-1 border-2 border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 transition-all hover:from-cyan-500/40 hover:to-blue-500/40 hover:shadow-[0_0_40px_#00ffff] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={starting}
            >
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>STARTING...</span>
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                  <span>START GAME</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Right Panel - Chat & Voice */}
      <div className="mt-4 flex w-full flex-col gap-4 lg:mt-0 lg:w-96">
        {/* Voice Chat */}
        <VoiceChatPanel
          roomId={game.room?.id || null}
          playerId={game.playerId}
          playerName={game.playerName}
          playerColor={game.playerColor}
        />

        {/* Chat Panel */}
        <div className="flex flex-1 flex-col rounded-xl border border-[#ff00ff]/30 bg-black/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-[#ff00ff]/30 p-3">
            <MessageSquare className="h-4 w-4 text-[#ff00ff]" />
            <h3 className="font-bold text-[#ff00ff]">LOBBY CHAT</h3>
          </div>

          <div
            ref={chatRef}
            className="flex-1 space-y-2 overflow-y-auto p-3"
            style={{ maxHeight: 300 }}
          >
            {game.messages.length === 0 && (
              <p className="text-center text-sm text-gray-500">No messages yet...</p>
            )}
            {game.messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-bold" style={{ color: getColorHex(msg.color) }}>
                  {msg.name}:
                </span>{" "}
                <span className="text-gray-300">{msg.body}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-[#ff00ff]/30 p-3">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Type a message..."
              className="flex-1 border-[#ff00ff]/50 bg-black/50 text-white"
            />
            <Button
              onClick={handleSendChat}
              className="border border-[#ff00ff] bg-[#ff00ff]/20 text-[#ff00ff] hover:bg-[#ff00ff]/40"
            >
              SEND
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-gray-900/95 p-6">
            <h2 className="mb-6 text-2xl font-bold text-cyan-400">Game Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Impostors</label>
                <select
                  value={settings.impostors}
                  onChange={(e) => setSettings({ ...settings, impostors: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 p-2 text-white"
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Discussion Time (seconds)</label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  value={settings.discussionTime}
                  onChange={(e) => setSettings({ ...settings, discussionTime: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-cyan-400">{settings.discussionTime}s</span>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Voting Time (seconds)</label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  value={settings.votingTime}
                  onChange={(e) => setSettings({ ...settings, votingTime: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-cyan-400">{settings.votingTime}s</span>
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">Kill Cooldown (seconds)</label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={settings.killCooldown}
                  onChange={(e) => setSettings({ ...settings, killCooldown: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-cyan-400">{settings.killCooldown}s</span>
              </div>
            </div>

            <Button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full border-2 border-cyan-500 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/40"
            >
              SAVE
            </Button>
          </div>
        </div>
      )}

      {/* Cosmetics Modal */}
      {showCosmetics && (
        <CosmeticsSelector
          selectedColor={game.playerColor}
          selectedHat="none"
          selectedSkin="none"
          onColorChange={(c) => {
            // Update color in database
            if (game.room) {
              supabase
                .from("players")
                .update({ color: c })
                .eq("room_id", game.room.id)
                .eq("player_id", game.playerId)
            }
            game.setPlayerInfo(game.playerName, c)
          }}
          onHatChange={() => {}}
          onSkinChange={() => {}}
          onClose={() => setShowCosmetics(false)}
        />
      )}
    </div>
    </ErrorBoundary>
  )
}
