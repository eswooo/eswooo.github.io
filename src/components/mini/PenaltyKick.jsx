import PhaserGameShell from './PhaserGameShell'
import { createPenaltyGame } from '../../games/penalty'

// 페널티킥 (Phaser): 공을 당겨 놓으면 슛 + 골키퍼 다이빙. 5슛, 점수=골 수.
export default function PenaltyKick({ onResult }) {
  return (
    <PhaserGameShell
      createGame={createPenaltyGame}
      width={300}
      height={320}
      bestKey="mini:penalty-best"
      suffix="골"
      hint="공을 아래로 당겼다 놓아 슛! (5번)"
      onResult={onResult}
    />
  )
}
