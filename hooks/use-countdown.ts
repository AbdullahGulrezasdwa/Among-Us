"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseCountdownOptions {
  initialSeconds: number
  autoStart?: boolean
  onComplete?: () => void
  onTick?: (secondsLeft: number) => void
}

interface UseCountdownReturn {
  secondsLeft: number
  isRunning: boolean
  isComplete: boolean
  start: () => void
  pause: () => void
  reset: (newSeconds?: number) => void
  restart: (newSeconds?: number) => void
}

export function useCountdown({
  initialSeconds,
  autoStart = false,
  onComplete,
  onTick,
}: UseCountdownOptions): UseCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isComplete, setIsComplete] = useState(false)
  
  const onCompleteRef = useRef(onComplete)
  const onTickRef = useRef(onTick)
  
  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete
    onTickRef.current = onTick
  }, [onComplete, onTick])

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const newValue = prev - 1
        
        if (onTickRef.current) {
          onTickRef.current(newValue)
        }
        
        if (newValue <= 0) {
          setIsRunning(false)
          setIsComplete(true)
          if (onCompleteRef.current) {
            onCompleteRef.current()
          }
          return 0
        }
        
        return newValue
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, secondsLeft])

  const start = useCallback(() => {
    if (secondsLeft > 0) {
      setIsRunning(true)
      setIsComplete(false)
    }
  }, [secondsLeft])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback((newSeconds?: number) => {
    setSecondsLeft(newSeconds ?? initialSeconds)
    setIsRunning(false)
    setIsComplete(false)
  }, [initialSeconds])

  const restart = useCallback((newSeconds?: number) => {
    setSecondsLeft(newSeconds ?? initialSeconds)
    setIsRunning(true)
    setIsComplete(false)
  }, [initialSeconds])

  return {
    secondsLeft,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    restart,
  }
}
