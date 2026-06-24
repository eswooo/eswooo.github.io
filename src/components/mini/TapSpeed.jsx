import { useState, useRef, useEffect } from 'react'

const BEST_KEY = 'mini:tap-best'
const DURATION = 10

// 연타: 10초 동안 최대한 많이 탭. 점수=탭 수. (첫 탭에 타이머 시작)
export default function TapSpeed({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | running | done
  const [count, setCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)
  const countRef = useRef(null)
  const tapsRef = useRef(0)

  useEffect(() => () => clearInterval(countRef.current), [])

  const stop = () => {
    clearInterval(countRef.current)
    setPhase('done')
    if (!onResult && tapsRef.current > best) {
      setBest(tapsRef.current)
      try {
        localStorage.setItem(BEST_KEY, String(tapsRef.current))
      } catch {
        /* 무시 */
      }
    }
  }

  const tap = () => {
    if (phase === 'done') return
    if (phase === 'idle') {
      // 첫 탭에 시작
      tapsRef.current = 0
      setTimeLeft(DURATION)
      setPhase('running')
      countRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            stop()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    tapsRef.current += 1
    setCount(tapsRef.current)
  }

  const reset = () => {
    setPhase('idle')
    setCount(0)
    setTimeLeft(DURATION)
    tapsRef.current = 0
  }

  return (
    <div className="game">
      <div className="whack-head">
        <span>⏱ {timeLeft}s</span>
        <span>👆 {count}</span>
      </div>

      <button
        className={`tap-btn ${phase === 'running' ? 'tap-btn--on' : ''}`}
        onClick={tap}
        disabled={phase === 'done'}
      >
        {phase === 'idle' ? '여기를 연타!' : phase === 'running' ? count : `${count}회`}
      </button>

      {phase === 'done' && (
        <button className="primary-btn" onClick={reset}>
          다시 하기
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(count)} disabled={phase !== 'done'}>
          기록 반영 ▶ {phase === 'done' ? `(${count}회)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}회</p>
      )}
    </div>
  )
}
