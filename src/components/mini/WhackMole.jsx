import { useState, useRef, useEffect } from 'react'

const BEST_KEY = 'mini:whack-best'
const DURATION = 15

// 두더지 잡기: 15초 동안 랜덤 홀에 뜨는 두더지를 탭. 점수 = 잡은 수.
// onResult 있으면 멀티 모드: 한 판 끝나면 "기록 반영"으로 점수를 보고.
export default function WhackMole({ onResult }) {
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [active, setActive] = useState(null)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)

  const spawnRef = useRef(null)
  const countRef = useRef(null)
  const scoreRef = useRef(0)

  const clearTimers = () => {
    clearInterval(spawnRef.current)
    clearInterval(countRef.current)
  }
  useEffect(() => clearTimers, [])

  const stopGame = () => {
    clearTimers()
    setRunning(false)
    setActive(null)
    if (onResult) return // 멀티: best 저장 안 함 (점수는 '기록 반영'으로 보고)
    setBest((prev) => {
      const nb = Math.max(prev, scoreRef.current)
      try {
        localStorage.setItem(BEST_KEY, String(nb))
      } catch {
        /* 무시 */
      }
      return nb
    })
  }

  const start = () => {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(DURATION)
    setActive(null)
    setRunning(true)
    spawnRef.current = setInterval(() => setActive(Math.floor(Math.random() * 9)), 750)
    countRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopGame()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  const whack = (i) => {
    if (!running || i !== active) return
    scoreRef.current += 1
    setScore(scoreRef.current)
    setActive(null)
  }

  return (
    <div className="game">
      <div className="whack-head">
        <span>⏱ {timeLeft}s</span>
        <span>🔨 {score}점</span>
      </div>

      <div className="whack-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <button key={i} className="whack-hole" onClick={() => whack(i)} disabled={!running}>
            {running && active === i ? '🐹' : ''}
          </button>
        ))}
      </div>

      {!running && (
        <button className="primary-btn" onClick={start}>
          {score > 0 || timeLeft === 0 ? '다시 하기' : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button
          className="primary-btn"
          onClick={() => onResult(score)}
          disabled={running || timeLeft > 0}
        >
          기록 반영 ▶ {!running && timeLeft === 0 ? `(${score}점)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 점수: {best}점</p>
      )}
    </div>
  )
}
