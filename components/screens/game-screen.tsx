"use client"

import { useEffect, useState } from "react"
import { useGame } from "@/lib/game-store"
import { createClient, getColorHex, getColorGlow, type Player } from "@/lib/supabase"
import { TASKS, MAPS } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TaskModal } from "@/components/tasks/task-modals"
import { RoleReveal } from "@/components/role-reveal"
import { Minimap } from "@/components/minimap"
import { SabotagePanel } from "@/components/sabotage-panel"
import { VoiceChatPanel } from "@/components/voice-chat-panel"
import { Skull, AlertTriangle, Users, CheckCircle, Map, Zap, Eye, Target, Volume2, ChevronUp, X } from "lucide-react"

export function GameScreen() {
  const game = useGame()
  const supabase = createClient()
  const [cooldown, setCooldown] = useState(30)
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showRoleReveal, setShowRoleReveal] = useState(true)
  const [showMinimap, setShowMinimap] = useState(false)
  const [showSabotage, setShowSabotage] = useState(false)
  const [showVoice, setShowVoice] = useState(false)
  const [sabotageCooldown, setSabotageCooldown] = useState(0)
  const [activeSabotage, setActiveSabotage] = useState<{ type: string; locations: string[]; timer: number } | null>(null)

  const me = game.players.find((p) => p.player_id === game.playerId)
  const isImpostor = game.myRole === "impostor"
  const alivePlayers = game.players.filter((p) => p.is_alive)
  const deadPlayers = game.players.filter((p) => !p.is_alive)
  const map = MAPS.find((m) => m.id === game.room?.map) || MAPS[0]

  // Calculate task progress
  const crewPlayers = game.players.filter((p) => p.role === "crew")
  const totalTasks = crewPlayers.reduce((sum, p) => sum + p.tasks_total, 0)
  const doneTasks = crewPlayers.reduce((sum, p) => sum + p.tasks_done, 0)
  const taskProgress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

  // Get assigned tasks for this player
  const myTasks = TASKS.slice(0, me?.tasks_total || 5)

  // Subscribe to realtime
  useEffect(() => {
    if (!game.room) return

    const playersChannel = supabase
      .channel(`game-players:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${game.room.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Player
            game.updatePlayer(updated.player_id, updated)

            if (updated.player_id === game.playerId && !updated.is_alive) {
              game.setIsAlive(false)
            }
          }
        }
      )
      .subscribe()

    const roomChannel = supabase
      .channel(`game-room:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${game.room.id}` },
        (payload) => {
          const updated = payload.new as typeof game.room
          game.setRoom(updated)

          if (updated?.status === "meeting") {
            game.setMeetingId(Date.now().toString())
            game.clearVotes()
            game.setScreen("meeting")
          } else if (updated?.status === "ended") {
            game.setScreen("results")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(roomChannel)
    }
  }, [game.room?.id])

  // Kill cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Sabotage cooldown timer
  useEffect(() => {
    if (sabotageCooldown > 0) {
      const timer = setTimeout(() => setSabotageCooldown(sabotageCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [sabotageCooldown])

  // Active sabotage timer
  useEffect(() => {
    if (activeSabotage && activeSabotage.timer > 0) {
      const timer = setTimeout(() => {
        setActiveSabotage((prev) => (prev ? { ...prev, timer: prev.timer - 1 } : null))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (activeSabotage && activeSabotage.timer === 0) {
      // Sabotage wins if not fixed
      if (game.room) {
        supabase.from("rooms").update({ status: "ended", winner: "impostor" }).eq("id", game.room.id)
      }
    }
  }, [activeSabotage])

  // Check win conditions
  useEffect(() => {
    if (!game.room || game.room.status !== "playing") return

    const aliveCrews = game.players.filter((p) => p.role === "crew" && p.is_alive)
    const aliveImpostors = game.players.filter((p) => p.role === "impostor" && p.is_alive)

    if (aliveImpostors.length >= aliveCrews.length && aliveImpostors.length > 0) {
      supabase.from("rooms").update({ status: "ended", winner: "impostor" }).eq("id", game.room.id)
    }

    if (aliveImpostors.length === 0) {
      supabase.from("rooms").update({ status: "ended", winner: "crew" }).eq("id", game.room.id)
    }

    if (taskProgress >= 100) {
      supabase.from("rooms").update({ status: "ended", winner: "crew" }).eq("id", game.room.id)
    }
  }, [game.players, taskProgress])

  async function handleKill(targetId: string) {
    if (!game.room || cooldown > 0 || !isImpostor || !game.isAlive) return

    await supabase
      .from("players")
      .update({ is_alive: false })
      .eq("room_id", game.room.id)
      .eq("player_id", targetId)

    setCooldown(30)
  }

  async function handleReport() {
    if (!game.room || !game.isAlive) return

    await supabase
      .from("rooms")
      .update({ status: "meeting", meeting_caller: game.playerId })
      .eq("id", game.room.id)
  }

  async function handleTaskComplete(taskIndex: number) {
    if (!game.room || !game.isAlive || isImpostor) return

    const newDone = Math.min((me?.tasks_done || 0) + 1, me?.tasks_total || 5)
    await supabase
      .from("players")
      .update({ tasks_done: newDone })
      .eq("room_id", game.room.id)
      .eq("player_id", game.playerId)

    setShowTaskModal(false)
    setSelectedTaskIndex(null)
  }

  function handleSabotage(sabotageId: string) {
    setSabotageCooldown(30)
    // In a real game, this would broadcast the sabotage to all players
    setActiveSabotage({
      type: sabotageId.toUpperCase(),
      locations: ["Reactor", "O2"],
      timer: 45,
    })
  }

  if (showRoleReveal) {
    return (
      <RoleReveal
        roleId={isImpostor ? "impostor" : "crewmate"}
        onComplete={() => setShowRoleReveal(false)}
      />
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Top HUD Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-cyan-500/30 bg-black/90 px-4 py-2 backdrop-blur-xl">
        {/* Role indicator */}
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-2"
          style={{
            backgroundColor: isImpostor ? "rgba(255, 0, 51, 0.2)" : "rgba(0, 255, 255, 0.2)",
            border: `2px solid ${isImpostor ? "#ff0033" : "#00ffff"}`,
            boxShadow: isImpostor ? "0 0 15px rgba(255, 0, 51, 0.3)" : "0 0 15px rgba(0, 255, 255, 0.3)",
          }}
        >
          {isImpostor ? <Skull className="h-5 w-5 text-red-500" /> : <Users className="h-5 w-5 text-cyan-400" />}
          <span className="font-black" style={{ color: isImpostor ? "#ff0033" : "#00ffff" }}>
            {isImpostor ? "IMPOSTOR" : "CREWMATE"}
          </span>
        </div>

        {/* Center - Task progress */}
        <div className="flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-lime-400" />
          <div className="w-32">
            <Progress value={taskProgress} className="h-2 bg-gray-800" />
          </div>
          <span className="text-sm text-lime-400">{Math.round(taskProgress)}%</span>
        </div>

        {/* Right - Status */}
        <div className="flex items-center gap-4">
          {!game.isAlive && (
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-bold text-red-500">
              DEAD
            </span>
          )}
          <div className="text-right">
            <p className="font-mono text-lg text-cyan-100">{game.room?.code}</p>
          </div>
        </div>
      </div>

      {/* Active Sabotage Warning */}
      {activeSabotage && (
        <div className="sticky top-12 z-30 animate-pulse border-b-2 border-red-500 bg-red-500/20 px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span className="text-xl font-black text-red-500">{activeSabotage.type}</span>
            <span className="rounded-lg bg-red-500 px-3 py-1 font-mono text-xl font-bold text-white">
              {activeSabotage.timer}s
            </span>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* Left Panel - Tasks */}
        <div className="w-full rounded-xl border border-cyan-500/30 bg-black/70 p-4 backdrop-blur-xl lg:w-80">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-cyan-300">
            <Zap className="h-5 w-5" />
            {isImpostor ? "FAKE TASKS" : "YOUR TASKS"}
          </h3>

          <div className="space-y-2">
            {myTasks.map((task, i) => {
              const done = i < (me?.tasks_done || 0)
              return (
                <button
                  key={task.id}
                  onClick={() => {
                    if (!done && game.isAlive && !isImpostor) {
                      setSelectedTaskIndex(i)
                      setShowTaskModal(true)
                    }
                  }}
                  disabled={done || !game.isAlive || isImpostor}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    done
                      ? "border-lime-500/50 bg-lime-500/10"
                      : "border-cyan-500/30 bg-black/50 hover:border-cyan-400 hover:bg-cyan-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={done ? "text-lime-400 line-through" : "text-white"}>
                      {task.name}
                    </span>
                    {done && <CheckCircle className="h-4 w-4 text-lime-400" />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <Map className="h-3 w-3" />
                    {task.location}
                  </div>
                </button>
              )
            })}
          </div>

          {/* My progress */}
          <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-400">Your Progress</span>
              <span className="text-cyan-400">
                {me?.tasks_done || 0}/{me?.tasks_total || 5}
              </span>
            </div>
            <Progress
              value={((me?.tasks_done || 0) / (me?.tasks_total || 5)) * 100}
              className="h-2"
            />
          </div>
        </div>

        {/* Center Panel - Players */}
        <div className="flex-1 rounded-xl border border-[#ff00ff]/30 bg-black/70 p-4 backdrop-blur-xl">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#ff00ff]">
            <Eye className="h-5 w-5" />
            PLAYERS ({alivePlayers.length} alive)
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {alivePlayers.map((player) => (
              <div
                key={player.player_id}
                className="group relative flex flex-col items-center rounded-xl border border-white/10 bg-black/50 p-4 transition-all hover:border-[#ff00ff]/50"
              >
                {/* Impostor indicator (only visible to impostors) */}
                {isImpostor && player.role === "impostor" && player.player_id !== game.playerId && (
                  <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500" />
                )}

                <div
                  className="mb-3 flex h-16 w-14 items-end justify-center rounded-t-full rounded-b-lg transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: getColorHex(player.color),
                    boxShadow: getColorGlow(player.color),
                  }}
                >
                  <div className="mb-6 h-5 w-8 rounded-sm bg-cyan-200/80" />
                </div>

                <p className="max-w-full truncate text-sm font-bold text-white">
                  {player.name}
                  {player.player_id === game.playerId && " (YOU)"}
                </p>

                {/* Kill button for impostors */}
                {isImpostor && game.isAlive && player.player_id !== game.playerId && (
                  <Button
                    onClick={() => handleKill(player.player_id)}
                    disabled={cooldown > 0}
                    size="sm"
                    className="mt-3 w-full border border-red-500 bg-red-500/20 text-xs text-red-400 transition-all hover:bg-red-500/40 hover:shadow-[0_0_20px_#ff0033] disabled:opacity-30"
                  >
                    <Target className="mr-1 h-3 w-3" />
                    {cooldown > 0 ? `${cooldown}s` : "KILL"}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Dead players */}
          {deadPlayers.length > 0 && (
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h4 className="mb-3 text-sm font-bold text-gray-500">DEAD ({deadPlayers.length})</h4>
              <div className="flex flex-wrap gap-2">
                {deadPlayers.map((player) => (
                  <div
                    key={player.player_id}
                    className="flex items-center gap-2 rounded-lg border border-gray-800 bg-black/50 px-3 py-2 opacity-50"
                  >
                    <div
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: getColorHex(player.color) }}
                    />
                    <span className="text-sm text-gray-500 line-through">{player.name}</span>
                    <Skull className="h-3 w-3 text-red-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Actions & Minimap */}
        <div className="flex w-full flex-col gap-4 lg:w-80">
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleReport}
              disabled={!game.isAlive || deadPlayers.length === 0}
              className="h-16 w-full border-2 border-orange-500 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-xl font-black text-orange-400 transition-all hover:from-orange-500/40 hover:to-red-500/40 hover:shadow-[0_0_40px_#ff6600] disabled:opacity-30"
            >
              <AlertTriangle className="mr-2 h-6 w-6" />
              REPORT BODY
            </Button>

            <Button
              onClick={handleReport}
              disabled={!game.isAlive}
              className="h-16 w-full border-2 border-red-500 bg-red-500/20 text-xl font-black text-red-400 transition-all hover:bg-red-500/40 hover:shadow-[0_0_40px_#ff0033] disabled:opacity-30"
            >
              <Users className="mr-2 h-6 w-6" />
              EMERGENCY MEETING
            </Button>

            {/* Sabotage button (impostors only) */}
            {isImpostor && game.isAlive && (
              <Button
                onClick={() => setShowSabotage(true)}
                disabled={sabotageCooldown > 0}
                className="h-14 w-full border-2 border-purple-500 bg-purple-500/20 text-lg font-black text-purple-400 transition-all hover:bg-purple-500/40 hover:shadow-[0_0_30px_#9933ff] disabled:opacity-30"
              >
                <Zap className="mr-2 h-5 w-5" />
                {sabotageCooldown > 0 ? `SABOTAGE (${sabotageCooldown}s)` : "SABOTAGE"}
              </Button>
            )}
          </div>

          {/* Minimap */}
          <div className="flex-1">
            <button
              onClick={() => setShowMinimap(true)}
              className="w-full"
            >
              <Minimap
                mapId={map.id}
                players={game.players.map((p) => ({
                  name: p.name,
                  color: p.color,
                  isAlive: p.is_alive,
                  position: { x: Math.random() * 100, y: Math.random() * 100 },
                }))}
                currentPlayer={game.playerName}
                sabotageActive={activeSabotage}
              />
            </button>
          </div>

          {/* Player Status */}
          <div className="rounded-xl border border-cyan-500/30 bg-black/70 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-12 items-end justify-center rounded-t-full rounded-b-lg"
                style={{
                  backgroundColor: getColorHex(game.playerColor),
                  boxShadow: getColorGlow(game.playerColor),
                  opacity: game.isAlive ? 1 : 0.4,
                }}
              >
                <div className="mb-5 h-4 w-7 rounded-sm bg-cyan-200/80" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{game.playerName}</p>
                <p
                  className="text-sm font-bold"
                  style={{ color: game.isAlive ? "#00ff00" : "#ff0033" }}
                >
                  {game.isAlive ? "ALIVE" : "DEAD"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-cyan-500/30 bg-black/95 p-2 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setShowMinimap(true)}
          className="flex flex-col items-center gap-1 rounded-lg p-2 text-cyan-400"
        >
          <Map className="h-6 w-6" />
          <span className="text-xs">Map</span>
        </button>

        <button
          onClick={() => setShowVoice(!showVoice)}
          className="flex flex-col items-center gap-1 rounded-lg p-2 text-cyan-400"
        >
          <Volume2 className="h-6 w-6" />
          <span className="text-xs">Voice</span>
        </button>

        <button
          onClick={handleReport}
          disabled={!game.isAlive}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/30 text-red-400 disabled:opacity-30"
        >
          <AlertTriangle className="h-8 w-8" />
        </button>

        {isImpostor && (
          <button
            onClick={() => setShowSabotage(true)}
            disabled={sabotageCooldown > 0}
            className="flex flex-col items-center gap-1 rounded-lg p-2 text-purple-400 disabled:opacity-30"
          >
            <Zap className="h-6 w-6" />
            <span className="text-xs">{sabotageCooldown > 0 ? sabotageCooldown : "Sabotage"}</span>
          </button>
        )}
      </div>

      {/* Voice Chat Slide-up (Mobile) */}
      {showVoice && (
        <div className="fixed bottom-16 left-0 right-0 z-50 p-4 lg:hidden">
          <div className="rounded-t-2xl border border-cyan-500/30 bg-gray-900/95">
            <button
              onClick={() => setShowVoice(false)}
              className="flex w-full items-center justify-center gap-2 border-b border-gray-700 py-2 text-gray-400"
            >
              <ChevronUp className="h-5 w-5 rotate-180" />
              <span className="text-sm">Hide Voice Chat</span>
            </button>
            <div className="p-4">
              <VoiceChatPanel
                roomId={game.room?.id || null}
                playerId={game.playerId}
                playerName={game.playerName}
                playerColor={game.playerColor}
                isInGame={true}
                isAlive={game.isAlive}
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && selectedTaskIndex !== null && (
        <TaskModal
          taskType={myTasks[selectedTaskIndex]?.type || "progress"}
          onComplete={() => handleTaskComplete(selectedTaskIndex)}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTaskIndex(null)
          }}
        />
      )}

      {/* Expanded Minimap Modal */}
      {showMinimap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-3xl">
            <Minimap
              mapId={map.id}
              players={game.players.map((p) => ({
                name: p.name,
                color: p.color,
                isAlive: p.is_alive,
                position: { x: Math.random() * 100, y: Math.random() * 100 },
              }))}
              currentPlayer={game.playerName}
              sabotageActive={activeSabotage}
              expanded={true}
              onClose={() => setShowMinimap(false)}
            />
          </div>
        </div>
      )}

      {/* Sabotage Panel */}
      {showSabotage && (
        <SabotagePanel
          mapId={map.id}
          onSabotage={handleSabotage}
          onClose={() => setShowSabotage(false)}
          cooldown={sabotageCooldown}
          disabled={!game.isAlive}
        />
      )}
    </div>
  )
}
