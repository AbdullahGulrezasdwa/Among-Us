"use client"

import { useGame } from "@/lib/game-store"
import { HomeScreen } from "./screens/home-screen"
import { LobbyScreen } from "./screens/lobby-screen"
import { GameScreen } from "./screens/game-screen"
import { MeetingScreen } from "./screens/meeting-screen"
import { ResultsScreen } from "./screens/results-screen"

export function Game() {
  const { screen } = useGame()

  switch (screen) {
    case "home":
      return <HomeScreen />
    case "lobby":
      return <LobbyScreen />
    case "game":
      return <GameScreen />
    case "meeting":
      return <MeetingScreen />
    case "results":
      return <ResultsScreen />
    default:
      return <HomeScreen />
  }
}
