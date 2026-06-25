import PhaserGameShell from './PhaserGameShell'
import { createBaseballGame } from '../../games/baseball'

// 야구 타격 (Phaser): 20구 동안 타이밍 스윙 → 홈런4/안타1. 점수.
export default function BaseballHit({ onResult }) {
  return (
    <PhaserGameShell
      createGame={createBaseballGame}
      width={300}
      height={360}
      bestKey="mini:baseball-best"
      suffix="점"
      hint="공이 올 때 화면을 탭해서 스윙! (20구)"
      onResult={onResult}
    />
  )
}
