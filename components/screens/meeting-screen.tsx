"use client"

import { useEffect, useState, useRef } from "react"
import { useGame } from "@/lib/game-store"
import { createClient, getColorHex, getColorGlow, type Vote, type Message } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VoiceChatPanel } from "@/components/voice-chat-panel"
import { AlertTriangle, Clock, Check, X, MessageSquare, Users, Skull, Ban, Volume2 } from "lucide-react"

export function MeetingScreen() {
  const game = useGame()
  const supabase = createClient()
  const [chatInput, setChatInput] = useState("")
  const [timeLeft, setTimeLeft] = useState(60)
  const [phase, setPhase] = useState<"discussion" | "voting" | "results">("discussion")
  const [discussionTime] = useState(30)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [ejectedPlayer, setEjectedPlayer] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const alivePlayers = game.players.filter((p) => p.is_alive)
  const meetingId = game.currentMeetingId || "meeting"
  const caller = game.players.find((p) => p.player_id === game.room?.meeting_caller)

  // Subscribe to votes and messages
  useEffect(() => {
    if (!game.room) return

    supabase
      .from("votes")
      .select("*")
      .eq("room_id", game.room.id)
      .eq("meeting_id", meetingId)
      .then(({ data }) => {
        if (data) game.setVotes(data)
      })

    supabase
      .from("messages")
      .select("*")
      .eq("room_id", game.room.id)
      .eq("channel", meetingId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) game.setMessages(data)
      })

    const votesChannel = supabase
      .channel(`votes:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `room_id=eq.${game.room.id}` },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            game.addVote(payload.new as Vote)
          }
        }
      )
      .subscribe()

    const messagesChannel = supabase
      .channel(`meeting-messages:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${game.room.id}` },
        (payload) => {
          const msg = payload.new as Message
          if (msg.channel === meetingId) {
            game.addMessage(msg)
          }
        }
      )
      .subscribe()

    const roomChannel = supabase
      .channel(`meeting-room:${game.room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${game.room.id}` },
        (payload) => {
          const updated = payload.new as typeof game.room
          game.setRoom(updated)

          if (updated?.status === "playing") {
            game.setScreen("game")
          } else if (updated?.status === "ended") {
            game.setScreen("results")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(roomChannel)
    }
  }, [game.room?.id, meetingId])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [game.messages])

  // Phase transitions and countdown
  useEffect(() => {
    if (phase === "discussion" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setPhase("voting")
            return 60 // Voting time
          }
          return t - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    } else if (phase === "voting" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [phase, timeLeft])

  // When voting ends, tally votes (host only)
  useEffect(() => {
    if (phase === "voting" && timeLeft === 0) {
      setPhase("results")
      if (game.players.find((p) => p.player_id === game.playerId)?.is_host) {
        tallyVotes()
      }
    }
  }, [phase, timeLeft])

  async function tallyVotes() {
    if (!game.room) return

    const voteCounts: Record<string, number> = { skip: 0 }
    alivePlayers.forEach((p) => {
      voteCounts[p.player_id] = 0
    })

    game.votes.forEach((v) => {
      if (v.target_id === null) {
        voteCounts.skip++
      } else if (voteCounts[v.target_id] !== undefined) {
        voteCounts[v.target_id]++
      }
    })

    let maxVotes = 0
    let ejected: string | null = null
    let tie = false

    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count
        ejected = id === "skip" ? null : id
        tie = false
      } else if (count === maxVotes && count > 0) {
        tie = true
      }
    })

    if (tie || ejected === null) {
      setEjectedPlayer(null)
    } else {
      setEjectedPlayer(ejected)
      await supabase
        .from("players")
        .update({ is_alive: false })
        .eq("room_id", game.room.id)
        .eq("player_id", ejected)
    }

    setShowResults(true)

    // After showing results, check win conditions and continue
    setTimeout(async () => {
      const { data: updatedPlayers } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", game.room!.id)

      if (updatedPlayers) {
        const aliveCrews = updatedPlayers.filter((p) => p.role === "crew" && p.is_alive)
        const aliveImpostors = updatedPlayers.filter((p) => p.role === "impostor" && p.is_alive)

        if (aliveImpostors.length >= aliveCrews.length && aliveImpostors.length > 0) {
          await supabase.from("rooms").update({ status: "ended", winner: "impostor" }).eq("id", game.room!.id)
          return
        }

        if (aliveImpostors.length === 0) {
          await supabase.from("rooms").update({ status: "ended", winner: "crew" }).eq("id", game.room!.id)
          return
        }
      }

      await supabase.from("rooms").update({ status: "playing", meeting_caller: null }).eq("id", game.room!.id)
    }, 5000)
  }

  async function handleVote(targetId: string | null) {
    if (!game.room || !game.isAlive || hasVoted || phase !== "voting") return

    await supabase.from("votes").upsert({
      room_id: game.room.id,
      meeting_id: meetingId,
      voter_id: game.playerId,
      target_id: targetId,
    })

    setHasVoted(true)
    setSelectedTarget(targetId)
  }

  async function handleSendChat() {
    if (!chatInput.trim() || !game.room || !game.isAlive) return

    await supabase.from("messages").insert({
      room_id: game.room.id,
      player_id: game.playerId,
      name: game.playerName,
      color: game.playerColor,
      body: chatInput.trim(),
      channel: meetingId,
    })

    setChatInput("")
  }

  const getVoteCount = (targetId: string | null) => {
    return game.votes.filter((v) => v.target_id === targetId).length
  }

  const getVoters = (targetId: string | null) => {
    return game.votes
      .filter((v) => v.target_id === targetId)
      .map((v) => game.players.find((p) => p.player_id === v.voter_id))
      .filter(Boolean)
  }

  // Results overlay
  if (showResults) {
    const ejectedPlayerData = ejectedPlayer ? game.players.find((p) => p.player_id === ejectedPlayer) : null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="space-y-8 text-center">
          {ejectedPlayerData ? (
            <>
              <div className="animate-bounce">
                <div
                  className="mx-auto flex h-32 w-28 items-end justify-center rounded-t-full rounded-b-lg"
                  style={{
                    backgroundColor: getColorHex(ejectedPlayerData.color),
                    boxShadow: getColorGlow(ejectedPlayerData.color),
                  }}
                >
                  <div className="mb-12 h-10 w-16 rounded-sm bg-cyan-200/80" />
                </div>
              </div>

              <h1
                className="text-4xl font-black"
                style={{ textShadow: "0 0 30px #ff6600", color: "#ff6600" }}
              >
                {ejectedPlayerData.name} WAS EJECTED
              </h1>

              <p className="text-xl text-gray-400">
                {ejectedPlayerData.role === "impostor" ? (
                  <span className="text-red-500">They were an Impostor.</span>
                ) : (
                  <span className="text-cyan-400">They were not an Impostor.</span>
                )}
              </p>

              <p className="text-gray-500">
                {game.players.filter((p) => p.role === "impostor" && p.is_alive && p.player_id !== ejectedPlayer).length} Impostor(s) remain
              </p>
            </>
          ) : (
            <>
              <Ban className="mx-auto h-24 w-24 text-gray-500" />
              <h1
                className="text-4xl font-black"
                style={{ textShadow: "0 0 30px #888", color: "#888" }}
              >
                NO ONE WAS EJECTED
              </h1>
              <p className="text-xl text-gray-400">(Skipped or Tied)</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-900 to-black p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <AlertTriangle className="h-10 w-10 animate-pulse text-orange-500" />
          <h1
            className="text-5xl font-black tracking-wider"
            style={{ textShadow: "0 0 40px #ff6600, 0 0 80px #ff6600", color: "#ff6600" }}
          >
            {phase === "discussion" ? "DISCUSSION" : phase === "voting" ? "VOTING" : "RESULTS"}
          </h1>
          <AlertTriangle className="h-10 w-10 animate-pulse text-orange-500" />
        </div>

        {caller && (
          <p className="mb-4 text-lg text-gray-400">
            Meeting called by{" "}
            <span className="font-bold" style={{ color: getColorHex(caller.color) }}>
              {caller.name}
            </span>
          </p>
        )}

        {/* Timer */}
        <div
          className="mx-auto inline-flex items-center gap-3 rounded-xl px-8 py-3"
          style={{
            backgroundColor: timeLeft <= 10 ? "rgba(255, 0, 51, 0.3)" : "rgba(255, 102, 0, 0.2)",
            border: `3px solid ${timeLeft <= 10 ? "#ff0033" : "#ff6600"}`,
            boxShadow: timeLeft <= 10 ? "0 0 30px #ff0033" : "0 0 20px #ff6600",
          }}
        >
          <Clock className="h-6 w-6" style={{ color: timeLeft <= 10 ? "#ff0033" : "#ff6600" }} />
          <span
            className="font-mono text-4xl font-black"
            style={{ color: timeLeft <= 10 ? "#ff0033" : "#ff6600" }}
          >
            {timeLeft}s
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          {phase === "discussion" ? "Discuss who might be the impostor" : "Cast your vote now"}
        </p>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-3">
        {/* Left - Players & Voting */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-orange-500/30 bg-black/70 p-4 backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-orange-300">
              <Users className="h-5 w-5" />
              VOTE TO EJECT ({alivePlayers.length} alive)
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {alivePlayers.map((player) => {
                const isMe = player.player_id === game.playerId
                const voteCount = getVoteCount(player.player_id)
                const voters = getVoters(player.player_id)
                const isSelected = selectedTarget === player.player_id
                const canVote = phase === "voting" && game.isAlive && !hasVoted && !isMe

                return (
                  <button
                    key={player.player_id}
                    onClick={() => canVote && handleVote(player.player_id)}
                    disabled={!canVote}
                    className={`group relative flex flex-col items-center rounded-xl border-2 p-4 transition-all ${
                      isSelected
                        ? "border-red-500 bg-red-500/20 shadow-[0_0_20px_#ff0033]"
                        : canVote
                          ? "border-white/10 bg-black/50 hover:border-orange-500/50 hover:bg-orange-500/10"
                          : "border-white/5 bg-black/30 opacity-60"
                    }`}
                  >
                    <div
                      className="mb-3 flex h-14 w-12 items-end justify-center rounded-t-full rounded-b-lg transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: getColorHex(player.color),
                        boxShadow: getColorGlow(player.color),
                      }}
                    >
                      <div className="mb-5 h-4 w-7 rounded-sm bg-cyan-200/80" />
                    </div>

                    <p className="mb-1 max-w-full truncate font-bold text-white">
                      {player.name}
                      {isMe && " (YOU)"}
                    </p>

                    {/* Vote count badge */}
                    {voteCount > 0 && (
                      <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 font-bold text-white shadow-lg">
                        {voteCount}
                      </div>
                    )}

                    {/* Voters display */}
                    {voters.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-center gap-1">
                        {voters.map((voter) => (
                          <div
                            key={voter!.player_id}
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: getColorHex(voter!.color) }}
                            title={voter!.name}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Skip Vote */}
              <button
                onClick={() => phase === "voting" && game.isAlive && !hasVoted && handleVote(null)}
                disabled={phase !== "voting" || !game.isAlive || hasVoted}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                  selectedTarget === null && hasVoted
                    ? "border-gray-500 bg-gray-500/20"
                    : phase === "voting" && game.isAlive && !hasVoted
                      ? "border-gray-600 bg-black/50 hover:border-gray-400 hover:bg-gray-500/10"
                      : "border-gray-700 bg-black/30 opacity-50"
                }`}
              >
                <Ban className="mb-2 h-10 w-10 text-gray-500" />
                <span className="font-bold text-gray-400">SKIP VOTE</span>

                {getVoteCount(null) > 0 && (
                  <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-500 font-bold text-white shadow-lg">
                    {getVoteCount(null)}
                  </div>
                )}
              </button>
            </div>

            {/* Status messages */}
            {hasVoted && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-lime-500/20 p-3">
                <Check className="h-5 w-5 text-lime-400" />
                <span className="font-bold text-lime-400">Vote submitted! Waiting for others...</span>
              </div>
            )}

            {!game.isAlive && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-gray-500/20 p-3">
                <Skull className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">Dead players cannot vote</span>
              </div>
            )}

            {phase === "discussion" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-orange-500/20 p-3">
                <MessageSquare className="h-5 w-5 text-orange-400" />
                <span className="text-orange-400">Discuss before voting begins...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right - Chat & Voice */}
        <div className="flex flex-col gap-4">
          {/* Voice Chat */}
          <VoiceChatPanel
            roomId={game.room?.id || null}
            playerId={game.playerId}
            playerName={game.playerName}
            playerColor={game.playerColor}
            isInGame={true}
            isAlive={game.isAlive}
          />

          {/* Chat Panel */}
          <div className="flex flex-1 flex-col rounded-xl border border-cyan-500/30 bg-black/70 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-cyan-500/30 p-3">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <h3 className="font-bold text-cyan-300">DISCUSSION</h3>
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
                <div key={msg.id} className="animate-in slide-in-from-bottom-2 text-sm">
                  <span className="font-bold" style={{ color: getColorHex(msg.color) }}>
                    {msg.name}:
                  </span>{" "}
                  <span className="text-gray-300">{msg.body}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-cyan-500/30 p-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder={game.isAlive ? "Type a message..." : "Dead players cannot chat"}
                disabled={!game.isAlive}
                className="flex-1 border-cyan-500/50 bg-black/50 text-white"
              />
              <Button
                onClick={handleSendChat}
                disabled={!game.isAlive}
                className="border border-cyan-500 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40"
              >
                SEND
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
