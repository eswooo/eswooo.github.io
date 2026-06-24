import { useState, useEffect, useRef } from 'react'

const SIZE = 260
const C = SIZE / 2
const R = 120
const COLORS = ['#ff6b35', '#ffb238', '#2d9d78', '#2d6cdf', '#9b5de5', '#e0457b']
const SPIN_MS = 4200

const rad = (deg) => (deg * Math.PI) / 180
// 위(12시)에서 시계방향 각도 → 좌표
const ptAt = (deg) => [C + R * Math.sin(rad(deg)), C - R * Math.cos(rad(deg))]

// 룰렛 돌리기: 휠을 돌려 상단 포인터가 가리키는 사람이 당첨
export default function WheelGame({ names }) {
  const seg = 360 / names.length
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const spin = () => {
    if (spinning || names.length < 2) return
    setSpinning(true)
    setWinner(null)
    const idx = Math.floor(Math.random() * names.length)
    const center = idx * seg + seg / 2
    const base = Math.ceil(rotation / 360) * 360
    const target = base + 5 * 360 + ((360 - center) % 360)
    setRotation(target)
    timer.current = setTimeout(() => {
      setWinner(names[idx])
      setSpinning(false)
    }, SPIN_MS)
  }

  return (
    <div className="game">
      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <svg className="wheel" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img">
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '50% 50%',
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.17,0.67,0.2,1)` : 'none',
            }}
          >
            {names.map((n, i) => {
              const a0 = i * seg
              const a1 = (i + 1) * seg
              const [x0, y0] = ptAt(a0)
              const [x1, y1] = ptAt(a1)
              const large = seg > 180 ? 1 : 0
              const [lx, ly] = (() => {
                const am = a0 + seg / 2
                return [C + R * 0.62 * Math.sin(rad(am)), C - R * 0.62 * Math.cos(rad(am))]
              })()
              return (
                <g key={i}>
                  <path
                    d={`M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={lx}
                    y={ly}
                    className="wheel__label"
                    transform={`rotate(${a0 + seg / 2}, ${lx}, ${ly})`}
                  >
                    {n.length > 5 ? n.slice(0, 5) : n}
                  </text>
                </g>
              )
            })}
          </g>
          <circle cx={C} cy={C} r="16" className="wheel__hub" />
        </svg>
      </div>

      <button className="primary-btn" onClick={spin} disabled={spinning || names.length < 2}>
        {spinning ? '도는 중…' : '🎡 돌리기'}
      </button>

      {winner && !spinning && (
        <div className="bet__result bet__result--done">
          <span className="bet__winner">{winner}</span>
          <span className="bet__msg">님이 쏩니다! ☕</span>
        </div>
      )}
    </div>
  )
}
