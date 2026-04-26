"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface GameSkeletonProps {
  variant?: "home" | "lobby" | "game" | "meeting"
  className?: string
}

export function GameSkeleton({ variant = "home", className }: GameSkeletonProps) {
  if (variant === "home") {
    return (
      <div className={cn("flex flex-col items-center justify-center min-h-screen p-8 space-y-8", className)}>
        {/* Title skeleton */}
        <Skeleton className="h-16 w-80 bg-cyan-950/50" />
        
        {/* Subtitle skeleton */}
        <Skeleton className="h-6 w-64 bg-gray-800/50" />
        
        {/* Buttons skeleton */}
        <div className="space-y-4 w-full max-w-sm">
          <Skeleton className="h-14 w-full bg-cyan-950/30" />
          <Skeleton className="h-14 w-full bg-magenta-950/30" />
        </div>
        
        {/* Footer skeleton */}
        <Skeleton className="h-4 w-48 bg-gray-800/30" />
      </div>
    )
  }

  if (variant === "lobby") {
    return (
      <div className={cn("flex flex-col min-h-screen p-6 space-y-6", className)}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 bg-cyan-950/50" />
          <Skeleton className="h-10 w-32 bg-gray-800/50" />
        </div>
        
        {/* Players grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <PlayerCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Bottom controls */}
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-32 bg-gray-800/50" />
          <Skeleton className="h-12 w-32 bg-cyan-950/50" />
        </div>
      </div>
    )
  }

  if (variant === "game") {
    return (
      <div className={cn("flex flex-col min-h-screen", className)}>
        {/* Top status bar */}
        <div className="h-16 bg-gray-900/50 flex items-center justify-between px-6">
          <Skeleton className="h-8 w-32 bg-gray-800/50" />
          <Skeleton className="h-8 w-48 bg-gray-800/50" />
          <Skeleton className="h-8 w-24 bg-gray-800/50" />
        </div>
        
        {/* Main game area */}
        <div className="flex-1 flex">
          {/* Map area */}
          <div className="flex-1 p-6">
            <Skeleton className="w-full h-full rounded-lg bg-gray-900/30" />
          </div>
          
          {/* Side panel */}
          <div className="w-64 bg-gray-900/30 p-4 space-y-4">
            <Skeleton className="h-6 w-24 bg-gray-800/50" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-gray-800/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "meeting") {
    return (
      <div className={cn("flex flex-col min-h-screen p-6 space-y-6", className)}>
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-64 mx-auto bg-red-950/50" />
          <Skeleton className="h-6 w-48 mx-auto bg-gray-800/50" />
        </div>
        
        {/* Voting grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <VotingCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Timer */}
        <div className="flex justify-center">
          <Skeleton className="h-16 w-32 rounded-full bg-gray-800/50" />
        </div>
      </div>
    )
  }

  return null
}

export function PlayerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gray-900/50 rounded-lg p-4 space-y-3 border border-gray-800/50",
        className
      )}
    >
      {/* Avatar */}
      <Skeleton className="w-16 h-16 rounded-full mx-auto bg-gray-800/50" />
      
      {/* Name */}
      <Skeleton className="h-5 w-24 mx-auto bg-gray-800/50" />
      
      {/* Status */}
      <Skeleton className="h-4 w-16 mx-auto bg-gray-800/30" />
    </div>
  )
}

export function VotingCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gray-900/50 rounded-lg p-4 space-y-3 border border-gray-800/50",
        className
      )}
    >
      {/* Avatar */}
      <Skeleton className="w-14 h-14 rounded-full mx-auto bg-gray-800/50" />
      
      {/* Name */}
      <Skeleton className="h-4 w-20 mx-auto bg-gray-800/50" />
      
      {/* Vote button */}
      <Skeleton className="h-8 w-full bg-gray-800/30" />
    </div>
  )
}

export function ChatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded-full bg-gray-800/50 shrink-0" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-20 bg-gray-800/50" />
            <Skeleton className="h-4 w-full bg-gray-800/30" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TaskListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-900/30 rounded">
          <Skeleton className="w-5 h-5 rounded bg-gray-800/50" />
          <Skeleton className="h-4 flex-1 bg-gray-800/50" />
        </div>
      ))}
    </div>
  )
}
