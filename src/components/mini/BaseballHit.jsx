import { useState, useRef, useEffect } from 'react'
import { now, randInt } from '../../lib/rng'

const BEST_KEY = 'mini:baseball-best'
const W = 300
const H = 360
const FAR_Y = 36 // 공 출발(멀리)
const NEAR_Y = H - 86 // 히트 지점(가까이)
const TOTAL = 20 // 투구 수

const lerp = (a, b, t) => a + (b - a) * t

// 구종: travel(ms 범위), curve(가로 휘는 폭)
const TYPES = [
  { key: 'straight', label: '직구', weight: 42, travel: [680, 850], curve: 0 },
  { key: 'fast', label: '속구', weight: 22, travel: [450, 600], curve: 0 },
  { key: 'curve', label: '커브', weight: 21, travel: [740, 920], curve: 64 },
  { key: 'change', label: '체인지업', weight: 15, travel: [980, 1240], curve: 24 },
]

function pickType() {
  const total = TYPES.reduce((s, t) => s + t.weight, 0)
  let r = randInt(total)
  for (const t of TYPES) {
    if (r < t.weight) return t
    r -= t.weight
  }
  return TYPES[0]
}

// 야구: 공이 원근감 있게 커지며 날아옴(구종/속도/커브 다양) → 타이밍 스윙. 20구 동안 점수.
export default function BaseballHit({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | pitching | result | over
  const [score, setScore] = useState(0)
  const [pitches, setPitches] = useState(0)
  const [last, setLast] = useState(null) // '홈런' | '안타' | '헛스윙'
  const [swinging, setSwinging] = useState(false)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)

  const ballRef = useRef(null)
  const rafRef = useRef(null)
  const delayRef = useRef(null)
  const swingResetRef = useRef(null)
  const pitchStart = useRef(0)
  const travel = useRef(900)
  const curveAmp = useRef(0)
  const curveDir = useRef(1)
  const swung = useRef(false)
  const scoreRef = useRef(0)
  const pitchRef = useRef(0)

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current)
    clearTimeout(delayRef.current)
    clearTimeout(swingResetRef.current)
  }
  useEffect(() => cleanup, [])

  // 진행도 p로 공 위치/크기 갱신 (원근감 + 커브)
  const setBall = (p) => {
    if (!ballRef.current) return
    const cy = lerp(FAR_Y, NEAR_Y, p)
    const cx = W / 2 + curveDir.current * curveAmp.current * Math.sin(Math.min(p, 1) * Math.PI)
    const scale = lerp(0.35, 1.5, p)
    ballRef.current.style.transition = 'none'
    ballRef.current.style.opacity = '1'
    ballRef.current.style.transform = `translate(${cx - 22}px, ${cy - 22}px) scale(${scale})`
  }

  const flyBall = () => {
    if (!ballRef.current) return
    const dir = randInt(2) ? 1 : -1
    ballRef.current.style.transition = 'transform 0.5s ease-out, opacity 0.5s'
    ballRef.current.style.transform = `translate(${W / 2 - 22 + dir * 160}px, ${-120}px) scale(1.9)`
    ballRef.current.style.opacity = '0'
  }

  const fadeBall = () => {
    if (!ballRef.current) return
    ballRef.current.style.transition = 'opacity 0.3s'
    ballRef.current.style.opacity = '0'
  }

  const end = () => {
    cleanup()
    setPhase('over')
    if (!onResult && scoreRef.current > best) {
      setBest(scoreRef.current)
      try {
        localStorage.setItem(BEST_KEY, String(scoreRef.current))
      } catch {
        /* 무시 */
      }
    }
  }

  const afterPlay = () => {
    delayRef.current = setTimeout(() => {
      if (pitchRef.current >= TOTAL) end()
      else pitch()
    }, 1000)
  }

  const loop = () => {
    const t = now() - pitchStart.current
    const p = t / travel.current
    setBall(Math.min(p, 1.1))
    if (!swung.current && p > 1.2) {
      setLast('헛스윙') // 놓침
      setPhase('result')
      fadeBall()
      afterPlay()
      return
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  const pitch = () => {
    const type = pickType()
    travel.current = type.travel[0] + randInt(type.travel[1] - type.travel[0])
    curveAmp.current = type.curve
    curveDir.current = randInt(2) ? 1 : -1
    pitchRef.current += 1
    setPitches(pitchRef.current)
    swung.current = false
    pitchStart.current = now()
    setLast(null)
    setPhase('pitching')
    setBall(0)
    rafRef.current = requestAnimationFrame(loop)
  }

  const start = () => {
    scoreRef.current = 0
    pitchRef.current = 0
    setScore(0)
    setPitches(0)
    pitch()
  }

  const doSwing = () => {
    setSwinging(true)
    clearTimeout(swingResetRef.current)
    swingResetRef.current = setTimeout(() => setSwinging(false), 260)
  }

  const swing = () => {
    if (phase !== 'pitching' || swung.current) return
    swung.current = true
    cancelAnimationFrame(rafRef.current)
    doSwing()
    const dt = Math.abs(now() - (pitchStart.current + travel.current))
    let result
    if (dt < 30) {
      result = '홈런'
      scoreRef.current += 4
      flyBall()
    } else if (dt < 120) {
      result = '안타'
      scoreRef.current += 1
      flyBall()
    } else {
      result = '헛스윙'
      fadeBall()
    }
    setScore(scoreRef.current)
    setLast(result)
    setPhase('result')
    afterPlay()
  }

  return (
    <div className="game">
      <div className="whack-head">
        <span>⚾ {score}점</span>
        <span>투구 {Math.min(pitches, TOTAL)}/{TOTAL}</span>
      </div>

      <p className="game__status">
        {phase === 'idle'
          ? '공이 올 때 화면을 탭해서 스윙! (20구)'
          : phase === 'over'
            ? `끝! ${TOTAL}구 동안 ${score}점`
            : '타이밍 맞춰 스윙!'}
      </p>

      <div className="bb-scene" onPointerDown={swing} style={{ aspectRatio: `${W} / ${H}` }}>
        <div className="bb-plate" style={{ top: `${(NEAR_Y / H) * 100}%` }} />
        <div ref={ballRef} className="bb-ball">
          ⚾
        </div>
        <div className={`bb-bat ${swinging ? 'bb-bat--swing' : ''}`}>🏏</div>
        {last && phase === 'result' && (
          <div className={`bb-result ${last === '헛스윙' ? 'bb-result--out' : ''}`}>
            {last === '홈런' ? '🎉 홈런!' : last === '안타' ? '👍 안타!' : '💨 헛스윙!'}
          </div>
        )}
      </div>

      {(phase === 'idle' || phase === 'over') && (
        <button className="primary-btn" onClick={start}>
          {phase === 'over' ? `다시 하기 (이번 ${score}점)` : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(score)} disabled={phase !== 'over'}>
          기록 반영 ▶ {phase === 'over' ? `(${score}점)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}점</p>
      )}
    </div>
  )
}
