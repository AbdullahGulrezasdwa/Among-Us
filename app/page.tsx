import { ThreeBackground } from "@/components/three-background"
import { GameProvider } from "@/components/game-provider"
import { Game } from "@/components/game"

export default function Page() {
  return (
    <>
      <ThreeBackground />
      <GameProvider>
        <Game />
      </GameProvider>
    </>
  )
}
