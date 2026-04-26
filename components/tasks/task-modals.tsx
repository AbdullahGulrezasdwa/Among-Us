"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Check, Zap, Hash, Download, Droplet, Navigation, Grid, Target, CreditCard, Thermometer, Trash, Move } from "lucide-react"

type TaskModalProps = {
  taskType: string
  onComplete: () => void
  onClose: () => void
}

// Wire colors for the wiring task
const WIRE_COLORS = ["#ff0033", "#00ff00", "#0066ff", "#ffff00"]

export function WiresTask({ onComplete, onClose }: TaskModalProps) {
  const [connections, setConnections] = useState<Record<number, number>>({})
  const [dragging, setDragging] = useState<number | null>(null)
  const [rightOrder] = useState(() =>
    [...Array(4)].map((_, i) => i).sort(() => Math.random() - 0.5)
  )

  const handleConnect = (left: number, right: number) => {
    const newConnections = { ...connections, [left]: right }
    setConnections(newConnections)

    // Check if all connected correctly
    if (Object.keys(newConnections).length === 4) {
      const allCorrect = Object.entries(newConnections).every(
        ([l, r]) => parseInt(l) === rightOrder[r]
      )
      if (allCorrect) {
        setTimeout(onComplete, 500)
      }
    }
  }

  return (
    <div className="relative rounded-2xl border-2 border-cyan-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-cyan-400" style={{ textShadow: "0 0 20px #00ffff" }}>
        FIX WIRING
      </h3>

      <div className="flex justify-between">
        {/* Left wires */}
        <div className="flex flex-col gap-4">
          {WIRE_COLORS.map((color, i) => (
            <button
              key={`left-${i}`}
              className="h-8 w-24 rounded-r-full transition-all hover:scale-105"
              style={{
                backgroundColor: color,
                boxShadow: dragging === i ? `0 0 20px ${color}` : undefined,
              }}
              onMouseDown={() => setDragging(i)}
              onMouseUp={() => {
                if (dragging !== null) {
                  setDragging(null)
                }
              }}
            >
              {connections[i] !== undefined && <Check className="ml-auto mr-2 h-5 w-5 text-white" />}
            </button>
          ))}
        </div>

        {/* Connection area */}
        <div className="flex w-32 items-center justify-center">
          <Zap className="h-12 w-12 text-cyan-400 animate-pulse" />
        </div>

        {/* Right wires */}
        <div className="flex flex-col gap-4">
          {rightOrder.map((colorIndex, i) => (
            <button
              key={`right-${i}`}
              className="h-8 w-24 rounded-l-full transition-all hover:scale-105"
              style={{
                backgroundColor: WIRE_COLORS[colorIndex],
                boxShadow: dragging !== null ? `0 0 20px ${WIRE_COLORS[colorIndex]}` : undefined,
              }}
              onMouseUp={() => {
                if (dragging !== null) {
                  handleConnect(dragging, i)
                  setDragging(null)
                }
              }}
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Connect matching colored wires
      </p>
    </div>
  )
}

export function SwitchesTask({ onComplete, onClose }: TaskModalProps) {
  const [pattern] = useState(() => [...Array(5)].map(() => Math.random() > 0.5))
  const [switches, setSwitches] = useState([false, false, false, false, false])

  const handleToggle = (index: number) => {
    const newSwitches = [...switches]
    newSwitches[index] = !newSwitches[index]
    setSwitches(newSwitches)

    if (newSwitches.every((s, i) => s === pattern[i])) {
      setTimeout(onComplete, 500)
    }
  }

  return (
    <div className="relative rounded-2xl border-2 border-lime-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-lime-400" style={{ textShadow: "0 0 20px #00ff00" }}>
        FLIP SWITCHES
      </h3>

      {/* Target pattern */}
      <div className="mb-4 flex justify-center gap-2">
        <span className="text-sm text-gray-400">TARGET:</span>
        {pattern.map((on, i) => (
          <div
            key={`target-${i}`}
            className="h-6 w-6 rounded"
            style={{ backgroundColor: on ? "#00ff00" : "#333" }}
          />
        ))}
      </div>

      {/* Switches */}
      <div className="flex justify-center gap-4">
        {switches.map((on, i) => (
          <button
            key={`switch-${i}`}
            onClick={() => handleToggle(i)}
            className="flex h-20 w-10 flex-col items-center justify-between rounded-lg border-2 border-gray-600 bg-gray-800 p-1 transition-all hover:border-lime-500"
          >
            <div
              className={`h-8 w-8 rounded transition-all ${on ? "translate-y-0 bg-lime-500 shadow-[0_0_15px_#00ff00]" : "translate-y-8 bg-gray-600"}`}
            />
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Match the pattern shown above
      </p>
    </div>
  )
}

export function KeypadTask({ onComplete, onClose }: TaskModalProps) {
  const [code] = useState(() => Math.floor(1000 + Math.random() * 9000).toString())
  const [input, setInput] = useState("")
  const [error, setError] = useState(false)

  const handlePress = (digit: string) => {
    if (input.length >= 4) return
    const newInput = input + digit
    setInput(newInput)

    if (newInput.length === 4) {
      if (newInput === code) {
        setTimeout(onComplete, 500)
      } else {
        setError(true)
        setTimeout(() => {
          setError(false)
          setInput("")
        }, 500)
      }
    }
  }

  return (
    <div className="relative rounded-2xl border-2 border-yellow-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-4 text-center text-2xl font-bold text-yellow-400" style={{ textShadow: "0 0 20px #ffff00" }}>
        <Hash className="mr-2 inline h-6 w-6" />
        ENTER CODE
      </h3>

      {/* Code display */}
      <div className="mb-4 rounded-lg border border-yellow-500/30 bg-black p-3 text-center font-mono text-3xl tracking-widest text-yellow-400">
        {code}
      </div>

      {/* Input display */}
      <div
        className={`mb-4 rounded-lg border p-3 text-center font-mono text-3xl tracking-widest transition-colors ${
          error ? "border-red-500 bg-red-500/20 text-red-400" : "border-gray-600 bg-gray-800 text-white"
        }`}
      >
        {input.padEnd(4, "_").split("").join(" ")}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "C"].map((key, i) =>
          key === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => (key === "C" ? setInput("") : handlePress(key.toString()))}
              className="h-12 rounded-lg border border-gray-600 bg-gray-800 font-mono text-xl font-bold text-white transition-all hover:border-yellow-500 hover:bg-gray-700 active:scale-95"
            >
              {key}
            </button>
          )
        )}
      </div>
    </div>
  )
}

export function DownloadTask({ onComplete, onClose }: TaskModalProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 300)
          return 100
        }
        return p + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="relative rounded-2xl border-2 border-blue-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-blue-400" style={{ textShadow: "0 0 20px #0066ff" }}>
        <Download className="mr-2 inline h-6 w-6 animate-bounce" />
        DOWNLOADING...
      </h3>

      <div className="mb-4 h-8 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
          style={{ width: `${progress}%`, boxShadow: "0 0 20px #0066ff" }}
        />
      </div>

      <p className="text-center font-mono text-2xl text-blue-400">{progress}%</p>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
        Do not close this window
      </div>
    </div>
  )
}

export function FuelTask({ onComplete, onClose }: TaskModalProps) {
  const [level, setLevel] = useState(0)
  const [holding, setHolding] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (holding && level < 100) {
      intervalRef.current = setInterval(() => {
        setLevel((l) => {
          if (l >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setTimeout(onComplete, 300)
            return 100
          }
          return l + 2
        })
      }, 50)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [holding, level, onComplete])

  return (
    <div className="relative rounded-2xl border-2 border-orange-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-orange-400" style={{ textShadow: "0 0 20px #ff6600" }}>
        <Droplet className="mr-2 inline h-6 w-6" />
        FUEL ENGINE
      </h3>

      {/* Fuel tank */}
      <div className="mx-auto mb-4 h-48 w-24 overflow-hidden rounded-lg border-2 border-orange-500/50 bg-gray-800">
        <div
          className="w-full bg-gradient-to-t from-orange-600 to-yellow-400 transition-all"
          style={{ height: `${level}%`, boxShadow: "0 0 30px #ff6600" }}
        />
      </div>

      <Button
        onMouseDown={() => setHolding(true)}
        onMouseUp={() => setHolding(false)}
        onMouseLeave={() => setHolding(false)}
        onTouchStart={() => setHolding(true)}
        onTouchEnd={() => setHolding(false)}
        className="w-full border-2 border-orange-500 bg-orange-500/20 text-orange-400 hover:bg-orange-500/40"
      >
        {holding ? "FUELING..." : "HOLD TO FUEL"}
      </Button>

      <p className="mt-4 text-center font-mono text-xl text-orange-400">{level}%</p>
    </div>
  )
}

export function PatternTask({ onComplete, onClose }: TaskModalProps) {
  const [pattern] = useState(() => [...Array(4)].map(() => Math.floor(Math.random() * 9)))
  const [input, setInput] = useState<number[]>([])
  const [showing, setShowing] = useState(true)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Show pattern sequence
    let i = 0
    const interval = setInterval(() => {
      if (i < pattern.length) {
        setActiveIndex(pattern[i])
        setTimeout(() => setActiveIndex(-1), 400)
        i++
      } else {
        clearInterval(interval)
        setShowing(false)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [pattern])

  const handlePress = (index: number) => {
    if (showing) return

    const newInput = [...input, index]
    setInput(newInput)

    if (newInput[newInput.length - 1] !== pattern[newInput.length - 1]) {
      setError(true)
      setTimeout(() => {
        setError(false)
        setInput([])
        setShowing(true)
        // Re-show pattern
        let i = 0
        const interval = setInterval(() => {
          if (i < pattern.length) {
            setActiveIndex(pattern[i])
            setTimeout(() => setActiveIndex(-1), 400)
            i++
          } else {
            clearInterval(interval)
            setShowing(false)
          }
        }, 600)
      }, 500)
      return
    }

    if (newInput.length === pattern.length) {
      setTimeout(onComplete, 500)
    }
  }

  return (
    <div className="relative rounded-2xl border-2 border-purple-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-purple-400" style={{ textShadow: "0 0 20px #9933ff" }}>
        <Grid className="mr-2 inline h-6 w-6" />
        MATCH PATTERN
      </h3>

      <div className={`grid grid-cols-3 gap-2 ${error ? "animate-shake" : ""}`}>
        {[...Array(9)].map((_, i) => (
          <button
            key={i}
            onClick={() => handlePress(i)}
            disabled={showing}
            className={`h-16 w-16 rounded-lg border-2 transition-all ${
              activeIndex === i || (input.includes(i) && input.indexOf(i) === pattern.indexOf(i))
                ? "border-purple-400 bg-purple-500 shadow-[0_0_20px_#9933ff]"
                : error
                  ? "border-red-500 bg-red-500/20"
                  : "border-gray-600 bg-gray-800 hover:border-purple-400"
            }`}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-gray-400">
        {showing ? "Watch the pattern..." : `${input.length}/${pattern.length} matched`}
      </p>
    </div>
  )
}

export function SwipeTask({ onComplete, onClose }: TaskModalProps) {
  const [status, setStatus] = useState<"ready" | "swiping" | "success" | "fail">("ready")
  const [position, setPosition] = useState(0)
  const startTimeRef = useRef(0)
  const startPosRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    startTimeRef.current = Date.now()
    startPosRef.current = e.clientX
    setStatus("swiping")
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (status !== "swiping") return
    const diff = e.clientX - startPosRef.current
    setPosition(Math.max(0, Math.min(200, diff)))
  }

  const handleMouseUp = () => {
    if (status !== "swiping") return

    const duration = Date.now() - startTimeRef.current
    const goodSwipe = position > 180 && duration > 400 && duration < 1200

    if (goodSwipe) {
      setStatus("success")
      setTimeout(onComplete, 500)
    } else {
      setStatus("fail")
      setTimeout(() => {
        setStatus("ready")
        setPosition(0)
      }, 500)
    }
  }

  return (
    <div className="relative rounded-2xl border-2 border-green-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-green-400" style={{ textShadow: "0 0 20px #00ff66" }}>
        <CreditCard className="mr-2 inline h-6 w-6" />
        SWIPE CARD
      </h3>

      {/* Card reader */}
      <div
        className="relative mx-auto h-16 w-64 cursor-pointer rounded-lg border-2 border-gray-600 bg-gray-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Card */}
        <div
          className={`absolute left-0 top-1 h-14 w-24 rounded-lg transition-colors ${
            status === "success"
              ? "bg-green-500 shadow-[0_0_20px_#00ff66]"
              : status === "fail"
                ? "bg-red-500 shadow-[0_0_20px_#ff0033]"
                : "bg-gradient-to-br from-cyan-400 to-blue-600"
          }`}
          style={{ transform: `translateX(${position}px)` }}
        >
          <div className="absolute bottom-2 left-2 right-2 h-2 rounded bg-yellow-400" />
        </div>

        {/* Arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
          →
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-400">
        {status === "ready" && "Drag the card at a steady pace"}
        {status === "swiping" && "Keep going..."}
        {status === "success" && "Accepted!"}
        {status === "fail" && "Too fast or too slow!"}
      </p>
    </div>
  )
}

export function TemperatureTask({ onComplete, onClose }: TaskModalProps) {
  const [target] = useState(() => Math.floor(Math.random() * 40) + 60) // 60-100
  const [current, setCurrent] = useState(50)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (Math.abs(current - target) <= 2 && !done) {
      setDone(true)
      setTimeout(onComplete, 500)
    }
  }, [current, target, done, onComplete])

  return (
    <div className="relative rounded-2xl border-2 border-red-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-red-400" style={{ textShadow: "0 0 20px #ff0033" }}>
        <Thermometer className="mr-2 inline h-6 w-6" />
        CALIBRATE TEMPERATURE
      </h3>

      <div className="mb-4 text-center">
        <span className="text-sm text-gray-400">TARGET: </span>
        <span className="font-mono text-2xl text-red-400">{target}°C</span>
      </div>

      <div className="mb-4 text-center">
        <span className="text-sm text-gray-400">CURRENT: </span>
        <span
          className={`font-mono text-2xl ${Math.abs(current - target) <= 2 ? "text-green-400" : "text-white"}`}
        >
          {current}°C
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="120"
        value={current}
        onChange={(e) => setCurrent(parseInt(e.target.value))}
        className="w-full accent-red-500"
      />

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>0°C</span>
        <span>120°C</span>
      </div>
    </div>
  )
}

export function GarbageTask({ onComplete, onClose }: TaskModalProps) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (holding && progress < 100) {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval)
            setTimeout(onComplete, 300)
            return 100
          }
          return p + 3
        })
      }, 50)
      return () => clearInterval(interval)
    }
  }, [holding, progress, onComplete])

  return (
    <div className="relative rounded-2xl border-2 border-amber-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-amber-400" style={{ textShadow: "0 0 20px #ffaa00" }}>
        <Trash className="mr-2 inline h-6 w-6" />
        EMPTY GARBAGE
      </h3>

      <div className="mx-auto mb-4 flex h-40 w-32 flex-col items-center justify-end overflow-hidden rounded-lg border-2 border-amber-500/30 bg-gray-800">
        <div
          className="w-full bg-gradient-to-t from-amber-700 to-amber-500 transition-all"
          style={{ height: `${100 - progress}%` }}
        />
      </div>

      <button
        onMouseDown={() => setHolding(true)}
        onMouseUp={() => setHolding(false)}
        onMouseLeave={() => setHolding(false)}
        onTouchStart={() => setHolding(true)}
        onTouchEnd={() => setHolding(false)}
        className={`mx-auto block rounded-full border-2 p-4 transition-all ${
          holding
            ? "border-amber-400 bg-amber-500/30 shadow-[0_0_20px_#ffaa00]"
            : "border-gray-600 bg-gray-800 hover:border-amber-400"
        }`}
      >
        <Move className="h-8 w-8 text-amber-400" />
      </button>

      <p className="mt-4 text-center text-sm text-gray-400">
        Hold and pull the lever down
      </p>
    </div>
  )
}

export function SteeringTask({ onComplete, onClose }: TaskModalProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [target] = useState({ x: 50, y: 50 })
  const [stable, setStable] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Random drift
    const interval = setInterval(() => {
      setPosition((p) => ({
        x: Math.max(0, Math.min(100, p.x + (Math.random() - 0.5) * 10)),
        y: Math.max(0, Math.min(100, p.y + (Math.random() - 0.5) * 10)),
      }))
    }, 200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const dist = Math.sqrt(Math.pow(position.x - target.x, 2) + Math.pow(position.y - target.y, 2))
    if (dist < 10) {
      setStable((s) => {
        if (s >= 100) {
          setTimeout(onComplete, 300)
          return 100
        }
        return s + 5
      })
    } else {
      setStable((s) => Math.max(0, s - 2))
    }
  }, [position, target, onComplete])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  return (
    <div className="relative rounded-2xl border-2 border-cyan-500/50 bg-gray-900 p-6">
      <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white">
        <X className="h-6 w-6" />
      </button>

      <h3 className="mb-6 text-center text-2xl font-bold text-cyan-400" style={{ textShadow: "0 0 20px #00ffff" }}>
        <Navigation className="mr-2 inline h-6 w-6" />
        STABILIZE STEERING
      </h3>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative mx-auto h-48 w-48 cursor-none rounded-full border-2 border-cyan-500/30 bg-gray-800"
      >
        {/* Target zone */}
        <div
          className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-500/50"
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
        />

        {/* Crosshair */}
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00ffff]"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        />

        {/* Crosshair lines */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-500/20" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-500/20" />
      </div>

      {/* Stability bar */}
      <div className="mx-auto mt-4 h-2 w-48 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full bg-cyan-400 transition-all"
          style={{ width: `${stable}%`, boxShadow: "0 0 10px #00ffff" }}
        />
      </div>

      <p className="mt-2 text-center text-sm text-gray-400">
        Keep the crosshair centered
      </p>
    </div>
  )
}

// Task modal wrapper
export function TaskModal({ taskType, onComplete, onClose }: TaskModalProps) {
  const taskComponents: Record<string, React.ComponentType<TaskModalProps>> = {
    wires: WiresTask,
    switches: SwitchesTask,
    keypad: KeypadTask,
    progress: DownloadTask,
    fuel: FuelTask,
    pattern: PatternTask,
    swipe: SwipeTask,
    temperature: TemperatureTask,
    garbage: GarbageTask,
    steering: SteeringTask,
  }

  const TaskComponent = taskComponents[taskType] || DownloadTask

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="animate-in zoom-in-95 duration-200">
        <TaskComponent taskType={taskType} onComplete={onComplete} onClose={onClose} />
      </div>
    </div>
  )
}
