import { useState, useRef, useEffect } from 'react'

const BEST_KEY = 'mini:timing-best'

// 타이밍 바: 마커가 0~1 왕복. 멈춤을 눌러 가운데(0.5)에 가까울수록 고점.
// onResult 있으면 멀티 모드: 멈춘 뒤 "기록 반영"으로 점수를 보고.
export default function TimingBar({ onResult }) {
  const [pos, setPos] = useState(0) // 0~1
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(null)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || null)
  const raf = useRef(null)
  const posRef = useRef(0)
  const dir = useRef(1)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const tick = () => {
    posRef.current += dir.current * 0.018
    if (posRef.current >= 1) {
      posRef.current = 1
      dir.current = -1
    } else if (posRef.current <= 0) {
      posRef.current = 0
      dir.current = 1
    }
    setPos(posRef.current)
    raf.current = requestAnimationFrame(tick)
  }

  const start = () => {
    setScore(null)
    setRunning(true)
    posRef.current = 0
    dir.current = 1
    raf.current = requestAnimationFrame(tick)
  }

  const stop = () => {
    cancelAnimationFrame(raf.current)
    setRunning(false)
    const dist = Math.abs(posRef.current - 0.5) // 0~0.5
    const s = Math.round(Math.max(0, 100 - dist * 200)) // 정중앙 100점
    setScore(s)
    if (!onResult && (best == null || s > best)) {
      setBest(s)
      try {
        localStorage.setItem(BEST_KEY, String(s))
      } catch {
        /* 무시 */
      }
    }
  }

  return (
    <div className="game">
      <div className="timing-track">
        <div className="timing-target" />
        <div className="timing-marker" style={{ left: `${pos * 100}%` }} />
      </div>

      {!running ? (
        <button className="primary-btn" onClick={start}>
          {score == null ? '▶ 시작' : '다시 하기'}
        </button>
      ) : (
        <button className="primary-btn" onClick={stop}>
          ✋ 멈춤!
        </button>
      )}

      {score != null && !running && (
        <div className="bet__result bet__result--done">
          <span className="bet__winner">{score}</span>
          <span className="bet__msg">점</span>
        </div>
      )}

      {onResult ? (
        <button
          className="primary-btn"
          onClick={() => onResult(score)}
          disabled={score == null || running}
        >
          기록 반영 ▶ {score != null ? `(${score}점)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 점수: {best != null ? `${best}점` : '-'}</p>
      )}
    </div>
  )
}
