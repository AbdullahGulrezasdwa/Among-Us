"use client"

import { useVoiceChat } from "@/hooks/use-voice-chat"
import { getColorHex, getColorGlow } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, AlertCircle } from "lucide-react"

type VoiceChatPanelProps = {
  roomId: string | null
  playerId: string
  playerName: string
  playerColor: string
  isInGame?: boolean
  isAlive?: boolean
}

export function VoiceChatPanel({
  roomId,
  playerId,
  playerName,
  playerColor,
  isInGame = false,
  isAlive = true,
}: VoiceChatPanelProps) {
  const {
    isConnected,
    isMuted,
    isDeafened,
    isSpeaking,
    voiceUsers,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleDeafen,
  } = useVoiceChat(roomId, playerId, playerName, playerColor)

  // Dead players can't use voice in game
  const canUseVoice = !isInGame || isAlive

  if (!canUseVoice && isInGame) {
    return (
      <div className="rounded-xl border border-gray-700/50 bg-black/70 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 text-gray-500">
          <MicOff className="h-5 w-5" />
          <span className="text-sm">Dead players cannot use voice chat</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-black/70 p-4 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-cyan-300">
          <Volume2 className="h-4 w-4" />
          VOICE CHAT
        </h3>
        <div className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-600"}`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Connection controls */}
      <div className="mb-4 flex gap-2">
        {!isConnected ? (
          <Button
            onClick={connect}
            className="flex-1 border border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500/40"
          >
            <Phone className="mr-2 h-4 w-4" />
            Join Voice
          </Button>
        ) : (
          <>
            <Button
              onClick={toggleMute}
              variant="outline"
              className={`flex-1 ${
                isMuted
                  ? "border-red-500/50 bg-red-500/20 text-red-400"
                  : "border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
              }`}
            >
              {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>

            <Button
              onClick={toggleDeafen}
              variant="outline"
              className={`${
                isDeafened
                  ? "border-orange-500/50 bg-orange-500/20 text-orange-400"
                  : "border-gray-600 bg-gray-800 text-gray-400"
              }`}
            >
              {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Button
              onClick={disconnect}
              variant="outline"
              className="border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/40"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Voice users */}
      {isConnected && (
        <div className="space-y-2">
          {/* Self */}
          <div
            className={`flex items-center gap-3 rounded-lg border p-2 transition-all ${
              isSpeaking && !isMuted
                ? "border-green-500/50 bg-green-500/10"
                : "border-gray-700 bg-gray-800/50"
            }`}
          >
            <div
              className="relative flex h-8 w-7 items-end justify-center rounded-t-full rounded-b-md"
              style={{
                backgroundColor: getColorHex(playerColor),
                boxShadow: isSpeaking && !isMuted ? getColorGlow(playerColor) : undefined,
              }}
            >
              <div className="mb-3 h-3 w-4 rounded-sm bg-cyan-200/80" />
              {isSpeaking && !isMuted && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-green-500" />
              )}
            </div>
            <span className="flex-1 text-sm font-medium text-white">{playerName} (You)</span>
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-400" />
            ) : (
              <Mic className={`h-4 w-4 ${isSpeaking ? "text-green-400" : "text-gray-400"}`} />
            )}
          </div>

          {/* Other users */}
          {voiceUsers
            .filter((u) => u.oderId !== playerId)
            .map((user) => (
              <div
                key={user.oderId}
                className={`flex items-center gap-3 rounded-lg border p-2 transition-all ${
                  user.isSpeaking
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-gray-700 bg-gray-800/50"
                }`}
              >
                <div
                  className="relative flex h-8 w-7 items-end justify-center rounded-t-full rounded-b-md"
                  style={{
                    backgroundColor: getColorHex(user.color),
                    boxShadow: user.isSpeaking ? getColorGlow(user.color) : undefined,
                  }}
                >
                  <div className="mb-3 h-3 w-4 rounded-sm bg-cyan-200/80" />
                  {user.isSpeaking && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-green-500" />
                  )}
                </div>
                <span className="flex-1 text-sm font-medium text-white">{user.name}</span>
                {user.isMuted ? (
                  <MicOff className="h-4 w-4 text-red-400" />
                ) : (
                  <Mic className={`h-4 w-4 ${user.isSpeaking ? "text-green-400" : "text-gray-400"}`} />
                )}
              </div>
            ))}

          {voiceUsers.length === 0 && (
            <p className="text-center text-sm text-gray-500">No one else in voice chat</p>
          )}
        </div>
      )}

      {/* Info when not connected */}
      {!isConnected && !error && (
        <p className="text-center text-sm text-gray-500">
          Join voice chat to communicate with other players
        </p>
      )}
    </div>
  )
}
