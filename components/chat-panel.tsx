"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { getColorHex } from "@/lib/supabase"
import { validateChatMessage } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatSkeleton } from "@/components/game-skeleton"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  player_id: string
  name: string
  color: string
  body: string
  channel: string
  created_at?: string
}

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  channel: "lobby" | "meeting" | "dead"
  disabled?: boolean
  isLoading?: boolean
  maxHeight?: number
  title?: string
  className?: string
  emptyMessage?: string
}

export function ChatPanel({
  messages,
  onSendMessage,
  channel,
  disabled = false,
  isLoading = false,
  maxHeight = 300,
  title = "CHAT",
  className,
  emptyMessage = "No messages yet...",
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(async () => {
    const validation = validateChatMessage(input)
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "Invalid message"
      toast.error(errorMessage)
      return
    }

    setSending(true)
    try {
      await onSendMessage(validation.data)
      setInput("")
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }, [input, onSendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !disabled && !sending) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend, disabled, sending]
  )

  // Channel-specific colors
  const channelColors = {
    lobby: {
      border: "border-[#ff00ff]/30",
      accent: "#ff00ff",
      bgAccent: "[#ff00ff]",
    },
    meeting: {
      border: "border-red-500/30",
      accent: "#ff4444",
      bgAccent: "red-500",
    },
    dead: {
      border: "border-gray-500/30",
      accent: "#888888",
      bgAccent: "gray-500",
    },
  }

  const colors = channelColors[channel]

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-black/70 backdrop-blur-xl",
        colors.border,
        className
      )}
      role="region"
      aria-label={`${channel} chat`}
    >
      {/* Header */}
      <div
        className={cn("flex items-center gap-2 border-b p-3", colors.border)}
      >
        <MessageSquare
          className="h-4 w-4"
          style={{ color: colors.accent }}
          aria-hidden="true"
        />
        <h3 className="font-bold" style={{ color: colors.accent }}>
          {title}
        </h3>
        {channel === "dead" && (
          <span className="text-xs text-gray-500">(ghosts only)</span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 space-y-2 overflow-y-auto p-3"
        style={{ maxHeight }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isLoading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
      </div>

      {/* Input */}
      <div className={cn("flex gap-2 border-t p-3", colors.border)}>
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Chat disabled" : "Type a message..."}
          disabled={disabled || sending}
          maxLength={200}
          className={cn(
            "flex-1 bg-black/50 text-white",
            `border-${colors.bgAccent}/50`
          )}
          style={{ borderColor: `${colors.accent}50` }}
          aria-label="Chat message input"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || sending || !input.trim()}
          className={cn(
            "border transition-all hover:opacity-80",
            `bg-${colors.bgAccent}/20 text-${colors.bgAccent}`
          )}
          style={{
            borderColor: colors.accent,
            backgroundColor: `${colors.accent}20`,
            color: colors.accent,
          }}
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  )
}

// Individual chat message component
function ChatMessage({ message }: { message: ChatMessage }) {
  const colorHex = getColorHex(message.color)
  
  return (
    <div className="text-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
      <span className="font-bold" style={{ color: colorHex }}>
        {message.name}:
      </span>{" "}
      <span className="text-gray-300 break-words">{message.body}</span>
    </div>
  )
}

// System message component
export function SystemMessage({
  message,
  type = "info",
}: {
  message: string
  type?: "info" | "warning" | "error" | "success"
}) {
  const colors = {
    info: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    error: "text-red-400 bg-red-500/10 border-red-500/30",
    success: "text-green-400 bg-green-500/10 border-green-500/30",
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-center text-sm font-medium",
        colors[type]
      )}
      role="status"
    >
      {message}
    </div>
  )
}
