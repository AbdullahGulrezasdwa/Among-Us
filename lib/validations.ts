import { z } from "zod"

// Player name validation
export const playerNameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(16, "Name must be 16 characters or less")
  .regex(
    /^[a-zA-Z0-9\s]+$/,
    "Name can only contain letters, numbers, and spaces"
  )
  .transform((val) => val.trim())

// Room code validation
export const roomCodeSchema = z
  .string()
  .length(6, "Room code must be exactly 6 characters")
  .regex(/^[A-Z0-9]+$/, "Room code must be uppercase letters and numbers")
  .transform((val) => val.toUpperCase())

// Chat message validation
export const chatMessageSchema = z
  .string()
  .min(1, "Message cannot be empty")
  .max(500, "Message must be 500 characters or less")
  .transform((val) => val.trim())
  .transform((val) => sanitizeHtml(val))

// Game settings validation
export const gameSettingsSchema = z.object({
  maxPlayers: z.number().min(4).max(15),
  impostors: z.number().min(1).max(3),
  discussionTime: z.number().min(0).max(300),
  votingTime: z.number().min(15).max(300),
  killCooldown: z.number().min(10).max(60),
  taskCount: z.number().min(1).max(10),
})

// Create/Join room form validation
export const createRoomFormSchema = z.object({
  playerName: playerNameSchema,
  selectedColor: z.string().min(1, "Please select a color"),
})

export const joinRoomFormSchema = z.object({
  playerName: playerNameSchema,
  roomCode: roomCodeSchema,
  selectedColor: z.string().min(1, "Please select a color"),
})

// Helper to sanitize HTML to prevent XSS
function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

// Validation helper functions
export function validatePlayerName(name: string): { valid: boolean; error?: string } {
  const result = playerNameSchema.safeParse(name)
  if (result.success) {
    return { valid: true }
  }
  return { valid: false, error: result.error.errors[0]?.message }
}

export function validateRoomCode(code: string): { valid: boolean; error?: string } {
  const result = roomCodeSchema.safeParse(code)
  if (result.success) {
    return { valid: true }
  }
  return { valid: false, error: result.error.errors[0]?.message }
}

export function validateChatMessage(message: string): { valid: boolean; error?: string; sanitized?: string } {
  const result = chatMessageSchema.safeParse(message)
  if (result.success) {
    return { valid: true, sanitized: result.data }
  }
  return { valid: false, error: result.error.errors[0]?.message }
}

// Type exports for form schemas
export type CreateRoomFormData = z.infer<typeof createRoomFormSchema>
export type JoinRoomFormData = z.infer<typeof joinRoomFormSchema>
export type GameSettingsData = z.infer<typeof gameSettingsSchema>
