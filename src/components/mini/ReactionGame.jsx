import { useState, useRef, useEffect } from 'react'

const BEST_KEY = 'mini:reaction-best'

// 반응속도: 빨강 → (랜덤) → 초록, 초록 되는 순간 탭. 가장 빠른 ms가 기록.
// onResult 있으면 멀티 모드: 한 판 후 "기록 반영" 버튼으로 점수를 위로 보고.
export default function ReactionGame({ onResult }) {
  const [state, setState] = useState('idle') // idle | waiting | ready | result | tooSoon
  const [ms, setMs] = useState(null)
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || null)
  const timer = useRef(null)
  const startAt = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const start = () => {
    setState('waiting')
    setMs(null)
    const delay = 1500 + Math.random() * 2500
    timer.current = setTimeout(() => {
      startAt.current = performance.now()
      setState('ready')
    }, delay)
  }

  const handleTap = () => {
    if (state === 'idle' || state === 'result' || state === 'tooSoon') {
      start()
    } else if (state === 'waiting') {
      clearTimeout(timer.current)
      setState('tooSoon')
    } else if (state === 'ready') {
      const reaction = Math.round(performance.now() - startAt.current)
      setMs(reaction)
      setState('result')
      if (!onResult && (best == null || reaction < best)) {
        setBest(reaction)
        try {
          localStorage.setItem(BEST_KEY, String(reaction))
        } catch {
          /* 무시 */
        }
      }
    }
  }

  const cls =
    state === 'ready'
      ? 'reaction--go'
      : state === 'waiting'
        ? 'reaction--wait'
        : 'reaction--idle'

  return (
    <div className="game">
      <div className={`reaction ${cls}`} onClick={handleTap}>
        {state === 'idle' && <span>탭하면 시작</span>}
        {state === 'waiting' && <span>초록색이 되면 탭!</span>}
        {state === 'ready' && <span>지금 탭!</span>}
        {state === 'tooSoon' && <span>너무 빨라요! 다시 탭</span>}
        {state === 'result' && (
          <span>
            <b className="reaction__ms">{ms}ms</b>
            <br />
            {onResult ? '' : '탭하면 다시'}
          </span>
        )}
      </div>

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(ms)} disabled={state !== 'result'}>
          기록 반영 ▶ {state === 'result' ? `(${ms}ms)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best != null ? `${best}ms` : '-'}</p>
      )}
    </div>
  )
}
