import { useState, useRef, useEffect } from 'react'
import { now, shuffle } from '../../lib/rng'

const BEST_KEY = 'mini:number-best'
const N = 16 // 4x4

function shuffled() {
  return shuffle(Array.from({ length: N }, (_, i) => i + 1))
}

// 숫자 순서 터치: 섞인 1~16을 순서대로 빠르게 터치. 점수=걸린 시간(ms).
export default function NumberOrder({ onResult }) {
  const [tiles, setTiles] = useState(shuffled)
  const [next, setNext] = useState(1)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || null)
  const startRef = useRef(0)
  const tickRef = useRef(null)

  useEffect(() => () => clearInterval(tickRef.current), [])

  const start = () => {
    setTiles(shuffled())
    setNext(1)
    setDone(false)
    setElapsed(0)
    setRunning(true)
    startRef.current = now()
    tickRef.current = setInterval(() => setElapsed(now() - startRef.current), 50)
  }

  const tap = (value) => {
    if (!running || value !== next) return
    if (value === N) {
      clearInterval(tickRef.current)
      const total = Math.round(now() - startRef.current)
      setElapsed(total)
      setRunning(false)
      setDone(true)
      setNext(N + 1)
      if (!onResult && (best == null || total < best)) {
        setBest(total)
        try {
          localStorage.setItem(BEST_KEY, String(total))
        } catch {
          /* 무시 */
        }
      }
    } else {
      setNext((n) => n + 1)
    }
  }

  return (
    <div className="game">
      <p className="game__status">
        {running ? `${(elapsed / 1000).toFixed(2)}초 — ${next}` : done ? `완료! ${(elapsed / 1000).toFixed(2)}초` : '시작을 누르고 1부터 순서대로!'}
      </p>

      <div className="num-grid">
        {tiles.map((v) => (
          <button
            key={v}
            className={`num-tile ${v < next ? 'num-tile--done' : ''}`}
            onClick={() => tap(v)}
            disabled={!running || v < next}
          >
            {v}
          </button>
        ))}
      </div>

      {!running && (
        <button className="primary-btn" onClick={start}>
          {done ? '다시 하기' : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(elapsed)} disabled={!done}>
          기록 반영 ▶ {done ? `(${(elapsed / 1000).toFixed(2)}초)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best != null ? `${(best / 1000).toFixed(2)}초` : '-'}</p>
      )}
    </div>
  )
}
