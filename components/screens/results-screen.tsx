"use client"

import { useState, useEffect } from "react"
import { useGame } from "@/lib/game-store"
import { getColorHex, getColorGlow } from "@/lib/supabase"
import { ROLES } from "@/lib/game-data"
import { Button } from "@/components/ui/button"
import { Trophy, Skull, Users, Star, Crown, ArrowRight, Sparkles, Shield, Heart } from "lucide-react"
import confetti from "canvas-confetti"

export function ResultsScreen() {
  const game = useGame()
  const [phase, setPhase] = useState<"reveal" | "roles" | "stats">("reveal")

  const winner = game.room?.winner
  const isCrewWin = winner === "crew"
  const iWon =
    (isCrewWin && game.myRole === "crew") || (!isCrewWin && game.myRole === "impostor")

  const impostors = game.players.filter((p) => p.role === "impostor")
  const crew = game.players.filter((p) => p.role === "crew")
  const survivors = game.players.filter((p) => p.is_alive)

  // Celebration effects
  useEffect(() => {
    if (iWon) {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: isCrewWin ? ["#00ffff", "#0066ff", "#00ff00"] : ["#ff0033", "#ff00ff", "#ff6600"],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: isCrewWin ? ["#00ffff", "#0066ff", "#00ff00"] : ["#ff0033", "#ff00ff", "#ff6600"],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [iWon, isCrewWin])

  // Phase transitions
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("roles"), 3000)
    const timer2 = setTimeout(() => setPhase("stats"), 6000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  function handlePlayAgain() {
    game.reset()
    game.setScreen("home")
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: isCrewWin
            ? "radial-gradient(circle at 50% 30%, #00ffff40 0%, transparent 50%)"
            : "radial-gradient(circle at 50% 30%, #ff003340 0%, transparent 50%)",
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Victory/Defeat Banner */}
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              {isCrewWin ? (
                <div className="animate-bounce rounded-full border-4 border-cyan-400 bg-cyan-500/20 p-6">
                  <Shield className="h-16 w-16 text-cyan-400" />
                </div>
              ) : (
                <div className="animate-bounce rounded-full border-4 border-red-500 bg-red-500/20 p-6">
                  <Skull className="h-16 w-16 text-red-500" />
                </div>
              )}
            </div>

            {/* Main title */}
            <h1
              className="animate-in zoom-in-50 text-7xl font-black tracking-wider"
              style={{
                textShadow: isCrewWin
                  ? "0 0 60px #00ffff, 0 0 120px #00ffff"
                  : "0 0 60px #ff0033, 0 0 120px #ff0033",
                color: isCrewWin ? "#00ffff" : "#ff0033",
              }}
            >
              {isCrewWin ? "CREWMATES WIN" : "IMPOSTORS WIN"}
            </h1>

            {/* Personal result */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {iWon ? (
                <>
                  <Trophy className="h-8 w-8 text-yellow-400" style={{ filter: "drop-shadow(0 0 10px #ffaa00)" }} />
                  <span
                    className="text-3xl font-black text-yellow-400"
                    style={{ textShadow: "0 0 20px #ffaa00" }}
                  >
                    VICTORY!
                  </span>
                  <Trophy className="h-8 w-8 text-yellow-400" style={{ filter: "drop-shadow(0 0 10px #ffaa00)" }} />
                </>
              ) : (
                <span className="text-3xl font-black text-gray-500">DEFEAT</span>
              )}
            </div>
          </div>

          {/* Impostor Reveal */}
          {phase !== "reveal" && (
            <div className="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border-2 border-red-500/30 bg-black/70 p-8 backdrop-blur-xl">
              <h3
                className="mb-6 text-center text-2xl font-black"
                style={{ color: "#ff0033", textShadow: "0 0 20px #ff0033" }}
              >
                <Skull className="mr-2 inline h-6 w-6" />
                THE IMPOSTORS WERE
              </h3>

              <div className="flex flex-wrap justify-center gap-8">
                {impostors.map((player, i) => (
                  <div
                    key={player.player_id}
                    className="animate-in zoom-in-50 flex flex-col items-center"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div className="relative">
                      {/* Death indicator */}
                      {!player.is_alive && (
                        <div className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1">
                          <X className="h-4 w-4 text-white" />
                        </div>
                      )}

                      <div
                        className="flex h-24 w-20 items-end justify-center rounded-t-full rounded-b-lg transition-all"
                        style={{
                          backgroundColor: getColorHex(player.color),
                          boxShadow: getColorGlow(player.color),
                          opacity: player.is_alive ? 1 : 0.6,
                        }}
                      >
                        <div className="mb-8 h-7 w-12 rounded-sm bg-cyan-200/80" />
                      </div>
                    </div>

                    <p className="mt-3 text-lg font-bold text-white">{player.name}</p>
                    <span className="rounded-full bg-red-500/30 px-3 py-1 text-sm font-bold text-red-400">
                      IMPOSTOR
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Players with Roles */}
          {phase === "stats" && (
            <div className="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border border-cyan-500/30 bg-black/70 p-6 backdrop-blur-xl">
              <h3 className="mb-6 text-center text-xl font-bold text-cyan-300">
                <Users className="mr-2 inline h-5 w-5" />
                ALL PLAYERS
              </h3>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {game.players.map((player, i) => (
                  <div
                    key={player.player_id}
                    className="animate-in zoom-in-75 flex flex-col items-center rounded-xl border bg-black/50 p-4"
                    style={{
                      borderColor: player.is_alive
                        ? player.role === "impostor"
                          ? "#ff0033"
                          : "#00ffff"
                        : "#333",
                      opacity: player.is_alive ? 1 : 0.5,
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    <div
                      className="mb-2 flex h-14 w-12 items-end justify-center rounded-t-full rounded-b-lg"
                      style={{
                        backgroundColor: getColorHex(player.color),
                        boxShadow: player.is_alive ? getColorGlow(player.color) : "none",
                      }}
                    >
                      <div className="mb-5 h-4 w-7 rounded-sm bg-cyan-200/80" />
                    </div>

                    <p className="max-w-full truncate text-sm font-bold text-white">{player.name}</p>

                    <span
                      className="mt-1 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: player.role === "impostor" ? "rgba(255, 0, 51, 0.3)" : "rgba(0, 255, 255, 0.3)",
                        color: player.role === "impostor" ? "#ff0033" : "#00ffff",
                      }}
                    >
                      {player.role.toUpperCase()}
                    </span>

                    {!player.is_alive && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
                        <Skull className="h-3 w-3" />
                        DEAD
                      </span>
                    )}

                    {player.role === "crew" && (
                      <span className="mt-1 text-xs text-gray-500">
                        Tasks: {player.tasks_done}/{player.tasks_total}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Stats */}
          {phase === "stats" && (
            <div className="animate-in fade-in slide-in-from-bottom-8 delay-300 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-500/30 bg-black/70 p-4 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
                <p className="text-3xl font-black text-cyan-400">{survivors.length}</p>
                <p className="text-sm text-gray-400">Survivors</p>
              </div>

              <div className="rounded-xl border border-lime-500/30 bg-black/70 p-4 text-center">
                <Star className="mx-auto mb-2 h-8 w-8 text-lime-400" />
                <p className="text-3xl font-black text-lime-400">
                  {Math.round(
                    (crew.reduce((sum, p) => sum + p.tasks_done, 0) /
                      crew.reduce((sum, p) => sum + p.tasks_total, 0)) *
                      100
                  )}
                  %
                </p>
                <p className="text-sm text-gray-400">Tasks Completed</p>
              </div>

              <div className="rounded-xl border border-red-500/30 bg-black/70 p-4 text-center">
                <Skull className="mx-auto mb-2 h-8 w-8 text-red-400" />
                <p className="text-3xl font-black text-red-400">
                  {game.players.filter((p) => !p.is_alive).length}
                </p>
                <p className="text-sm text-gray-400">Deaths</p>
              </div>
            </div>
          )}

          {/* Play Again Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handlePlayAgain}
              className="h-16 px-12 text-xl font-black border-2 border-cyan-500 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 transition-all hover:from-cyan-500/40 hover:to-blue-500/40 hover:shadow-[0_0_50px_#00ffff]"
            >
              <Sparkles className="mr-3 h-6 w-6" />
              PLAY AGAIN
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
