import { useState, useRef, useEffect } from 'react'
import { randInt } from '../../lib/rng'

const BEST_KEY = 'mini:simon-best'
const PADS = ['#2d9d78', '#2d6cdf', '#ffb238', '#d93a3a']

// 순서 기억(사이먼): 점점 길어지는 패드 순서를 따라 누르기. 점수=완료한 라운드.
export default function Simon({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | show | input | over
  const [active, setActive] = useState(null)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0) // 현재 시퀀스 길이(표시용)
  const seqRef = useRef([])
  const inputIdx = useRef(0)
  const timeouts = useRef([])
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)

  const clearAll = () => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }
  useEffect(() => clearAll, [])

  const playShow = (seq) => {
    setPhase('show')
    setActive(null)
    seq.forEach((pad, i) => {
      timeouts.current.push(setTimeout(() => setActive(pad), 600 * i + 200))
      timeouts.current.push(setTimeout(() => setActive(null), 600 * i + 550))
    })
    timeouts.current.push(
      setTimeout(() => {
        inputIdx.current = 0
        setPhase('input')
      }, 600 * seq.length + 250),
    )
  }

  const start = () => {
    clearAll()
    setScore(0)
    seqRef.current = [randInt(4)]
    setRound(1)
    playShow(seqRef.current)
  }

  const finish = (finalScore) => {
    setPhase('over')
    if (!onResult && finalScore > best) {
      setBest(finalScore)
      try {
        localStorage.setItem(BEST_KEY, String(finalScore))
      } catch {
        /* 무시 */
      }
    }
  }

  const tap = (pad) => {
    if (phase !== 'input') return
    setActive(pad)
    timeouts.current.push(setTimeout(() => setActive(null), 200))
    if (pad === seqRef.current[inputIdx.current]) {
      inputIdx.current += 1
      if (inputIdx.current === seqRef.current.length) {
        const completed = seqRef.current.length
        setScore(completed)
        // 다음 라운드
        timeouts.current.push(
          setTimeout(() => {
            seqRef.current = [...seqRef.current, randInt(4)]
            setRound(seqRef.current.length)
            playShow(seqRef.current)
          }, 600),
        )
      }
    } else {
      finish(score)
    }
  }

  const statusText =
    phase === 'idle'
      ? '시작을 누르면 순서가 나옵니다'
      : phase === 'show'
        ? '잘 보세요…'
        : phase === 'input'
          ? `따라 누르세요 (라운드 ${round})`
          : `끝! ${score}라운드 도달`

  return (
    <div className="game">
      <p className="game__status">{statusText}</p>

      <div className="simon-grid">
        {PADS.map((color, i) => (
          <button
            key={i}
            className="simon-pad"
            style={{ background: color, opacity: active === i ? 1 : 0.45 }}
            onClick={() => tap(i)}
            disabled={phase !== 'input'}
          />
        ))}
      </div>

      {(phase === 'idle' || phase === 'over') && (
        <button className="primary-btn" onClick={start}>
          {phase === 'over' ? '다시 하기' : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(score)} disabled={phase !== 'over'}>
          기록 반영 ▶ {phase === 'over' ? `(${score}라운드)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}라운드</p>
      )}
    </div>
  )
}
