import { useState } from 'react'

const BEST_KEY = 'mini:odd-best'

function buildBoard(level) {
  const cols = Math.min(2 + Math.floor((level - 1) / 3), 6) // 최대 6칸, 완만한 증가
  const hue = Math.floor(Math.random() * 360)
  const baseL = 65
  const diff = Math.max(4, 26 - level * 1.4) // 레벨↑ → 색차↓
  const base = `hsl(${hue}, 65%, ${baseL}%)`
  const odd = `hsl(${hue}, 65%, ${baseL - diff}%)`
  const oddIndex = Math.floor(Math.random() * cols * cols)
  return { cols, base, odd, oddIndex, count: cols * cols }
}

// 색 다른 타일 찾기: 한 칸만 미세히 다른 색. 맞히면 레벨업, 틀리면 종료. 점수=완료 레벨.
export default function OddColor({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | playing | over
  const [level, setLevel] = useState(1)
  const [board, setBoard] = useState(() => buildBoard(1))
  const [score, setScore] = useState(0)
  const [wrongPick, setWrongPick] = useState(null) // 틀리게 누른 칸
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)

  const start = () => {
    setLevel(1)
    setBoard(buildBoard(1))
    setScore(0)
    setWrongPick(null)
    setPhase('playing')
  }

  const gameOver = (finalScore) => {
    setPhase('over')
    setScore(finalScore)
    if (!onResult && finalScore > best) {
      setBest(finalScore)
      try {
        localStorage.setItem(BEST_KEY, String(finalScore))
      } catch {
        /* 무시 */
      }
    }
  }

  const tap = (i) => {
    if (phase !== 'playing') return
    if (i === board.oddIndex) {
      const nl = level + 1
      setLevel(nl)
      setBoard(buildBoard(nl))
    } else {
      setWrongPick(i)
      gameOver(level - 1) // 완료한 레벨 수
    }
  }

  return (
    <div className="game">
      <p className="game__status">
        {phase === 'playing'
          ? `레벨 ${level} — 다른 색 한 칸을 찾으세요`
          : phase === 'over'
            ? `땡! ✓ 칸이 정답이었어요 (${score}레벨 완료)`
            : '다른 색 타일을 빠르게 찾는 게임'}
      </p>

      {phase !== 'idle' && (
        <div className="odd-grid" style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: board.count }).map((_, i) => {
            const isAnswer = i === board.oddIndex
            const isWrong = phase === 'over' && i === wrongPick
            return (
              <button
                key={i}
                className={`odd-tile ${phase === 'over' && isAnswer ? 'odd-tile--answer' : ''} ${isWrong ? 'odd-tile--wrong' : ''}`}
                style={{ background: isAnswer ? board.odd : board.base }}
                onClick={() => tap(i)}
                disabled={phase !== 'playing'}
              >
                {phase === 'over' ? (isAnswer ? '✓' : isWrong ? '✗' : '') : ''}
              </button>
            )
          })}
        </div>
      )}

      {phase !== 'playing' && (
        <button className="primary-btn" onClick={start}>
          {phase === 'over' ? '다시 하기' : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(score)} disabled={phase !== 'over'}>
          기록 반영 ▶ {phase === 'over' ? `(${score}레벨)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}레벨</p>
      )}
    </div>
  )
}
