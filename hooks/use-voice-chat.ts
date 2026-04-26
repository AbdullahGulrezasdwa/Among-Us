"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase"

type VoiceUser = {
  oderId: string
  name: string
  color: string
  isSpeaking: boolean
  isMuted: boolean
  stream?: MediaStream
}

export function useVoiceChat(roomId: string | null, playerId: string, playerName: string, playerColor: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isDeafened, setIsDeafened] = useState(false)
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const supabase = createClient()

  // Initialize audio context and analyzer for voice detection
  const initAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const checkVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setIsSpeaking(average > 20) // Threshold for speaking detection
        }
        animationFrameRef.current = requestAnimationFrame(checkVolume)
      }
      checkVolume()
    } catch (err) {
      console.error("Audio analysis init error:", err)
    }
  }, [])

  // Start voice chat
  const connect = useCallback(async () => {
    if (!roomId) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStreamRef.current = stream

      // Mute by default
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false
      })

      initAudioAnalysis(stream)
      setIsConnected(true)
      setError(null)

      // Broadcast presence
      await supabase.from("messages").insert({
        room_id: roomId,
        player_id: playerId,
        name: playerName,
        color: playerColor,
        body: "joined voice chat",
        channel: "voice_system",
      })
    } catch (err) {
      setError("Microphone access denied. Please allow microphone access to use voice chat.")
      console.error("Voice chat error:", err)
    }
  }, [roomId, playerId, playerName, playerColor, initAudioAnalysis, supabase])

  // Disconnect voice chat
  const disconnect = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsConnected(false)
    setIsSpeaking(false)
    setVoiceUsers([])

    if (roomId) {
      await supabase.from("messages").insert({
        room_id: roomId,
        player_id: playerId,
        name: playerName,
        color: playerColor,
        body: "left voice chat",
        channel: "voice_system",
      })
    }
  }, [roomId, playerId, playerName, playerColor, supabase])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newMuted = !isMuted
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted
      })
      setIsMuted(newMuted)
    }
  }, [isMuted])

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    setIsDeafened((prev) => !prev)
  }, [])

  // Listen for voice presence updates
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`voice:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const msg = payload.new as { player_id: string; name: string; color: string; body: string; channel: string }
          if (msg.channel === "voice_system") {
            if (msg.body === "joined voice chat") {
              setVoiceUsers((prev) => {
                if (prev.some((u) => u.oderId === msg.player_id)) return prev
                return [...prev, { oderId: msg.player_id, name: msg.name, color: msg.color, isSpeaking: false, isMuted: false }]
              })
            } else if (msg.body === "left voice chat") {
              setVoiceUsers((prev) => prev.filter((u) => u.oderId !== msg.player_id))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
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
  }
}
