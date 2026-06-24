import { useState } from 'react'
import ReactionGame from './mini/ReactionGame'
import TimingBar from './mini/TimingBar'
import WhackMole from './mini/WhackMole'
import BombGame from './mini/BombGame'
import NumberOrder from './mini/NumberOrder'
import Simon from './mini/Simon'
import MathSprint from './mini/MathSprint'
import TapSpeed from './mini/TapSpeed'
import OddColor from './mini/OddColor'
import MemoryMatch from './mini/MemoryMatch'
import BaseballHit from './mini/BaseballHit'
import PenaltyKick from './mini/PenaltyKick'
import MultiPlay from './mini/MultiPlay'

// 게임 메타: Comp + 랭킹 정렬 방향/단위 포맷
const GAMES = [
  { key: 'reaction', label: '반응속도', icon: '⚡', Comp: ReactionGame, lowerIsBetter: true, format: (v) => `${v}ms` },
  { key: 'timing', label: '타이밍', icon: '🎯', Comp: TimingBar, lowerIsBetter: false, format: (v) => `${v}점` },
  { key: 'whack', label: '두더지', icon: '🐹', Comp: WhackMole, lowerIsBetter: false, format: (v) => `${v}점` },
  { key: 'bomb', label: '폭탄참기', icon: '💣', Comp: BombGame, lowerIsBetter: false, format: (v) => `${(v / 1000).toFixed(2)}초` },
  { key: 'number', label: '숫자순서', icon: '🔢', Comp: NumberOrder, lowerIsBetter: true, format: (v) => `${(v / 1000).toFixed(2)}초` },
  { key: 'simon', label: '순서기억', icon: '🧠', Comp: Simon, lowerIsBetter: false, format: (v) => `${v}라운드` },
  { key: 'math', label: '암산', icon: '➗', Comp: MathSprint, lowerIsBetter: false, format: (v) => `${v}개` },
  { key: 'tap', label: '연타', icon: '👆', Comp: TapSpeed, lowerIsBetter: false, format: (v) => `${v}회` },
  { key: 'odd', label: '색찾기', icon: '🎨', Comp: OddColor, lowerIsBetter: false, format: (v) => `${v}레벨` },
  { key: 'memory', label: '짝맞추기', icon: '🃏', Comp: MemoryMatch, lowerIsBetter: true, format: (v) => `${(v / 1000).toFixed(1)}초` },
  { key: 'baseball', label: '야구', icon: '⚾', Comp: BaseballHit, lowerIsBetter: false, format: (v) => `${v}점` },
  { key: 'penalty', label: '축구', icon: '⚽', Comp: PenaltyKick, lowerIsBetter: false, format: (v) => `${v}골` },
]

// 미니게임 모드: 싱글(내 기록) / 멀티(멤버별 기록 + 랭킹)
export default function MiniGames() {
  const [mode, setMode] = useState('single') // 'single' | 'multi'
  const [gameKey, setGameKey] = useState('reaction')

  const game = GAMES.find((g) => g.key === gameKey)
  const Comp = game.Comp

  return (
    <main className="content">
      <div className="bet">
        <h2 className="bet__title">미니게임 🎮</h2>

        <div className="mode-switch">
          <button
            className={`mode-switch__btn ${mode === 'single' ? 'mode-switch__btn--active' : ''}`}
            onClick={() => setMode('single')}
          >
            🙋 싱글플레이
          </button>
          <button
            className={`mode-switch__btn ${mode === 'multi' ? 'mode-switch__btn--active' : ''}`}
            onClick={() => setMode('multi')}
          >
            👥 멀티플레이
          </button>
        </div>

        <div className="game-nav">
          {GAMES.map((g) => (
            <button
              key={g.key}
              className={`game-nav__btn ${gameKey === g.key ? 'game-nav__btn--active' : ''}`}
              onClick={() => setGameKey(g.key)}
            >
              <span className="game-nav__icon">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>

        {mode === 'single' ? <Comp key={gameKey} /> : <MultiPlay key={gameKey} game={game} />}
      </div>
    </main>
  )
}
