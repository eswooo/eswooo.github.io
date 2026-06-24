import { useState, useRef, useEffect } from 'react'

const BEST_KEY = 'mini:bomb-best'

// 색 보간: 시작색(주황) → 터지는색(목표)
const START = { h: 28, s: 95, l: 58 }
const EXPLODE = { h: 0, s: 90, l: 22 }
const lerp = (a, b, t) => Math.round(a + (b - a) * t)
const EXPLODE_COLOR = `hsl(${EXPLODE.h}, ${EXPLODE.s}%, ${EXPLODE.l}%)`

// 폭탄 참기: 누르고 있는 동안 시간이 쌓이고, 랜덤(2~6초)에 폭발.
// 터지기 직전에 떼면 버틴 시간이 점수, 터지면 💥 0점.
// onResult 있으면 멀티 모드: 한 판 끝나면 "기록 반영"으로 점수(ms)를 보고.
export default function BombGame({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | holding | exploded | result
  const [elapsed, setElapsed] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)

  const explodeRef = useRef(null)
  const tickRef = useRef(null)
  const startRef = useRef(0)

  const cleanup = () => {
    clearTimeout(explodeRef.current)
    clearInterval(tickRef.current)
  }
  useEffect(() => cleanup, [])

  const press = () => {
    cleanup()
    setPhase('holding')
    setElapsed(0)
    startRef.current = performance.now()
    const fuse = 2000 + Math.random() * 4000
    explodeRef.current = setTimeout(() => {
      clearInterval(tickRef.current)
      setPhase('exploded')
    }, fuse)
    tickRef.current = setInterval(() => setElapsed(performance.now() - startRef.current), 50)
  }

  const release = () => {
    if (phase !== 'holding') return
    cleanup()
    const held = performance.now() - startRef.current
    setElapsed(held)
    setPhase('result')
    if (onResult) return // 멀티: best 저장 안 함
    setBest((prev) => {
      const nb = Math.max(prev, Math.round(held))
      try {
        localStorage.setItem(BEST_KEY, String(nb))
      } catch {
        /* 무시 */
      }
      return nb
    })
  }

  // 시작색(주황) → 터지는색(목표)으로 버틴 시간에 비례해 짙어진다.
  const progress = Math.min(elapsed / 6000, 1)
  const holdColor = `hsl(${lerp(START.h, EXPLODE.h, progress)}, ${lerp(START.s, EXPLODE.s, progress)}%, ${lerp(START.l, EXPLODE.l, progress)}%)`

  const label =
    phase === 'exploded'
      ? '💥'
      : phase === 'holding'
        ? `💣 ${(elapsed / 1000).toFixed(2)}s`
        : phase === 'result'
          ? `😮‍💨 ${(elapsed / 1000).toFixed(2)}s`
          : '💣'

  return (
    <div className="game">
      <p className="game__status">
        {phase === 'idle' && '버튼을 꾹 누르고 버티다가, 터지기 직전에 떼세요!'}
        {phase === 'holding' && '버티는 중… 떼면 기록!'}
        {phase === 'exploded' && '터졌어요! 0점 💥'}
        {phase === 'result' && `${(elapsed / 1000).toFixed(2)}초 버텼어요!`}
      </p>

      <div className="bomb-target">
        <span className="bomb-swatch" style={{ background: EXPLODE_COLOR }} />
        <span>이 색에 가까워질수록 곧 터져요 (터지는 색)</span>
      </div>

      <button
        className="bomb-btn"
        onPointerDown={press}
        onPointerUp={release}
        onPointerLeave={release}
        style={{
          touchAction: 'none',
          ...(phase === 'holding'
            ? { background: holdColor }
            : phase === 'exploded'
              ? { background: EXPLODE_COLOR, fontSize: '3rem' }
              : {}),
        }}
      >
        {label}
      </button>

      {onResult ? (
        <button
          className="primary-btn"
          onClick={() => onResult(phase === 'exploded' ? 0 : Math.round(elapsed))}
          disabled={phase !== 'result' && phase !== 'exploded'}
        >
          기록 반영 ▶{' '}
          {phase === 'result'
            ? `(${(elapsed / 1000).toFixed(2)}초)`
            : phase === 'exploded'
              ? '(0초 💥)'
              : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {(best / 1000).toFixed(2)}초</p>
      )}
    </div>
  )
}
