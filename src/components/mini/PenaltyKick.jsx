import { useState, useRef, useEffect } from 'react'
import { randInt } from '../../lib/rng'

const BEST_KEY = 'mini:penalty-best'
const W = 300
const HF = 320
const POST_L = 30
const GOAL_W = W - 60 // 240
const ZONE_W = GOAL_W / 3 // 80
const GOAL_Y = 70
const BALL = { x: W / 2, y: HF - 46 }
const TOTAL = 5 // 슛 횟수

const zoneCenterX = (z) => POST_L + (z + 0.5) * ZONE_W // 70 / 150 / 230

// 페널티킥: 공을 당겨서(드래그) 놓으면 발사 + 골키퍼 다이빙. 막히면 종료. 점수=연속 골.
export default function PenaltyKick({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | ready | dragging | shooting | result | over
  const [score, setScore] = useState(0)
  const [shots, setShots] = useState(0)
  const [last, setLast] = useState(null) // 'goal' | 'save'
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)

  const fieldRef = useRef(null)
  const ballRef = useRef(null)
  const keeperRef = useRef(null)
  const dragging = useRef(false)
  const startPt = useRef({ x: 0, y: 0 })
  const scoreRef = useRef(0)
  const shotsRef = useRef(0)
  const delayRef = useRef(null)
  const phaseRef = useRef('idle')

  const setPh = (p) => {
    phaseRef.current = p
    setPhase(p)
  }

  useEffect(() => () => clearTimeout(delayRef.current), [])

  const toLocal = (e) => {
    const r = fieldRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * HF }
  }

  const setBallTransform = (extra = '') => {
    if (ballRef.current) ballRef.current.style.transform = `translate(-50%, -50%) ${extra}`
  }
  const setKeeper = (x, rot, withTransition) => {
    if (!keeperRef.current) return
    keeperRef.current.style.transition = withTransition ? 'left 0.35s ease, transform 0.35s ease' : 'none'
    keeperRef.current.style.left = `${x}px`
    keeperRef.current.style.transform = `translateX(-50%) rotate(${rot}deg)`
  }

  const resetBallKeeper = () => {
    if (ballRef.current) {
      ballRef.current.style.transition = 'none'
      setBallTransform('')
    }
    setKeeper(W / 2, 0, false)
  }

  const start = () => {
    scoreRef.current = 0
    shotsRef.current = 0
    setScore(0)
    setShots(0)
    setLast(null)
    resetBallKeeper()
    setPh('ready')
  }

  const end = () => {
    clearTimeout(delayRef.current)
    setPh('over')
    if (!onResult && scoreRef.current > best) {
      setBest(scoreRef.current)
      try {
        localStorage.setItem(BEST_KEY, String(scoreRef.current))
      } catch {
        /* 무시 */
      }
    }
  }

  const nextShot = () => {
    setLast(null)
    resetBallKeeper()
    setPh('ready')
  }

  const shoot = (dx, dy) => {
    const targetX = Math.max(POST_L + 14, Math.min(W - POST_L - 14, BALL.x + -dx * 1.7))
    const zone = Math.max(0, Math.min(2, Math.floor((targetX - POST_L) / ZONE_W)))
    const keeperZone = randInt(3)
    setPh('shooting')

    // 공 발사 애니메이션
    if (ballRef.current) {
      ballRef.current.style.transition = 'transform 0.5s ease-out'
      setBallTransform(`translate(${targetX - BALL.x}px, ${GOAL_Y - BALL.y}px) scale(0.6)`)
    }
    // 골키퍼 다이빙
    const rot = keeperZone === 0 ? -35 : keeperZone === 2 ? 35 : 0
    setKeeper(zoneCenterX(keeperZone), rot, true)

    delayRef.current = setTimeout(() => {
      if (zone === keeperZone) {
        setLast('save')
      } else {
        scoreRef.current += 1
        setScore(scoreRef.current)
        setLast('goal')
      }
      shotsRef.current += 1
      setShots(shotsRef.current)
      setPh('result')
      delayRef.current = setTimeout(shotsRef.current >= TOTAL ? end : nextShot, 1000)
    }, 540)
    void dy
  }

  const onDown = (e) => {
    if (phaseRef.current !== 'ready') return
    dragging.current = true
    startPt.current = toLocal(e)
    fieldRef.current.setPointerCapture(e.pointerId)
    setPh('dragging')
  }

  const onMove = (e) => {
    if (!dragging.current) return
    const cur = toLocal(e)
    const dx = cur.x - startPt.current.x
    const dy = cur.y - startPt.current.y
    const len = Math.hypot(dx, dy)
    const k = Math.min(60, len) / (len || 1)
    if (ballRef.current) {
      ballRef.current.style.transition = 'none'
      setBallTransform(`translate(${dx * k}px, ${dy * k}px)`)
    }
  }

  const onUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    const cur = toLocal(e)
    const dx = cur.x - startPt.current.x
    const dy = cur.y - startPt.current.y
    if (Math.hypot(dx, dy) < 22 || dy <= 0) {
      // 너무 짧거나 위로 드래그(아래로 당겨야 슛) → 취소
      if (ballRef.current) {
        ballRef.current.style.transition = 'transform 0.15s'
        setBallTransform('')
      }
      setPh('ready')
      return
    }
    shoot(dx, dy)
  }

  return (
    <div className="game">
      <div className="whack-head">
        <span>⚽ {score}골</span>
        <span>슛 {Math.min(shots, TOTAL)}/{TOTAL}</span>
      </div>

      <p className="game__status">
        {phase === 'idle'
          ? '공을 아래로 당겼다 놓아 슛! (5번)'
          : phase === 'over'
            ? `끝! ${TOTAL}번 중 ${score}골`
            : last === 'goal'
              ? '⚽ 골!!'
              : last === 'save'
                ? '🧤 선방!'
                : phase === 'shooting'
                  ? '슛!'
                  : '공을 당겨서 조준하고 놓으세요'}
      </p>

      <div
        ref={fieldRef}
        className="pk-field"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ aspectRatio: `${W} / ${HF}` }}
      >
        <div className="pk-goal">
          {[0, 1, 2].map((z) => (
            <div key={z} className="pk-goal-zone" />
          ))}
        </div>
        <div ref={keeperRef} className="keeper" style={{ left: `${W / 2}px` }}>
          🧤
        </div>
        <div ref={ballRef} className="pk-ball" style={{ left: `${BALL.x}px`, top: `${BALL.y}px` }}>
          ⚽
        </div>
      </div>

      {(phase === 'idle' || phase === 'over') && (
        <button className="primary-btn" onClick={start}>
          {phase === 'over' ? `다시 하기 (이번 ${score}골)` : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(score)} disabled={phase !== 'over'}>
          기록 반영 ▶ {phase === 'over' ? `(${score}골)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}골</p>
      )}
    </div>
  )
}
