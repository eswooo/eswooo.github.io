import { useState, useRef, useEffect } from 'react'
import { now, shuffle } from '../../lib/rng'

const BEST_KEY = 'mini:memory-best'
const EMOJIS = ['🍔', '🍕', '🍣', '🍜', '🍗', '🍩', '🍦', '☕']

function buildDeck() {
  return shuffle([...EMOJIS, ...EMOJIS]).map((value, id) => ({ id, value, matched: false }))
}

// 카드 짝맞추기: 4×4 이모지 8쌍을 뒤집어 맞추기. 점수=클리어 시간(ms).
export default function MemoryMatch({ onResult }) {
  const [deck, setDeck] = useState(buildDeck)
  const [flipped, setFlipped] = useState([]) // 현재 뒤집은 카드 인덱스
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || null)
  const startRef = useRef(0)
  const tickRef = useRef(null)
  const lock = useRef(false)
  const matchedRef = useRef(0)
  const timeouts = useRef([])

  const cleanup = () => {
    clearInterval(tickRef.current)
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }
  useEffect(() => cleanup, [])

  const start = () => {
    cleanup()
    setDeck(buildDeck())
    setFlipped([])
    setDone(false)
    setElapsed(0)
    matchedRef.current = 0
    lock.current = false
    setRunning(true)
    startRef.current = now()
    tickRef.current = setInterval(() => setElapsed(now() - startRef.current), 100)
  }

  const finish = () => {
    clearInterval(tickRef.current)
    const total = Math.round(now() - startRef.current)
    setElapsed(total)
    setRunning(false)
    setDone(true)
    if (!onResult && (best == null || total < best)) {
      setBest(total)
      try {
        localStorage.setItem(BEST_KEY, String(total))
      } catch {
        /* 무시 */
      }
    }
  }

  const tap = (i) => {
    if (!running || lock.current || deck[i].matched || flipped.includes(i)) return
    const nf = [...flipped, i]
    setFlipped(nf)
    if (nf.length < 2) return

    lock.current = true
    const [a, b] = nf
    if (deck[a].value === deck[b].value) {
      timeouts.current.push(
        setTimeout(() => {
          setDeck((d) => d.map((c, idx) => (idx === a || idx === b ? { ...c, matched: true } : c)))
          setFlipped([])
          lock.current = false
          matchedRef.current += 2
          if (matchedRef.current === deck.length) finish()
        }, 350),
      )
    } else {
      timeouts.current.push(
        setTimeout(() => {
          setFlipped([])
          lock.current = false
        }, 700),
      )
    }
  }

  const isUp = (i) => flipped.includes(i) || deck[i].matched

  return (
    <div className="game">
      <p className="game__status">
        {running ? `${(elapsed / 1000).toFixed(1)}초` : done ? `클리어! ${(elapsed / 1000).toFixed(1)}초` : '같은 그림 8쌍을 맞춰보세요'}
      </p>

      <div className="memory-grid">
        {deck.map((c, i) => (
          <button
            key={c.id}
            className={`memory-card ${isUp(i) ? 'memory-card--up' : ''} ${c.matched ? 'memory-card--matched' : ''}`}
            onClick={() => tap(i)}
            disabled={!running}
          >
            {isUp(i) ? c.value : ''}
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
          기록 반영 ▶ {done ? `(${(elapsed / 1000).toFixed(1)}초)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best != null ? `${(best / 1000).toFixed(1)}초` : '-'}</p>
      )}
    </div>
  )
}
