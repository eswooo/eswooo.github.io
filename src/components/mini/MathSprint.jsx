import { useState, useRef, useEffect } from 'react'
import { randInt } from '../../lib/rng'

const BEST_KEY = 'mini:math-best'
const DURATION = 30

function makeProblem() {
  const ops = ['+', '-', '×']
  const op = ops[randInt(ops.length)]
  let a = randInt(12) + 1
  let b = randInt(12) + 1
  let answer
  if (op === '+') answer = a + b
  else if (op === '-') {
    if (b > a) [a, b] = [b, a] // 음수 방지
    answer = a - b
  } else answer = a * b

  // 보기 4개 (정답 + 근접 오답)
  const options = new Set([answer])
  while (options.size < 4) {
    const cand = answer + (randInt(9) - 4)
    if (cand >= 0) options.add(cand)
  }
  return { text: `${a} ${op} ${b}`, answer, options: [...options].sort(() => Math.random() - 0.5) }
}

// 암산: 사칙연산 4지선다. 30초 제한 + 틀리면 즉시 종료. 점수=맞춘 개수.
export default function MathSprint({ onResult }) {
  const [phase, setPhase] = useState('idle') // idle | playing | over
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [problem, setProblem] = useState(makeProblem)
  const [reason, setReason] = useState(null) // 'time' | 'wrong'
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY)) || 0)
  const countRef = useRef(null)
  const scoreRef = useRef(0)

  useEffect(() => () => clearInterval(countRef.current), [])

  const end = (why) => {
    clearInterval(countRef.current)
    setPhase('over')
    setReason(why)
    if (!onResult && scoreRef.current > best) {
      setBest(scoreRef.current)
      try {
        localStorage.setItem(BEST_KEY, String(scoreRef.current))
      } catch {
        /* 무시 */
      }
    }
  }

  const start = () => {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(DURATION)
    setProblem(makeProblem())
    setReason(null)
    setPhase('playing')
    countRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          end('time')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  const answer = (val) => {
    if (phase !== 'playing') return
    if (val === problem.answer) {
      scoreRef.current += 1
      setScore(scoreRef.current)
      setProblem(makeProblem())
    } else {
      end('wrong')
    }
  }

  return (
    <div className="game">
      <div className="whack-head">
        <span>⏱ {timeLeft}s</span>
        <span>✅ {score}</span>
      </div>

      <p className="game__status">
        {phase === 'playing'
          ? '틀리면 즉시 종료!'
          : phase === 'over'
            ? reason === 'wrong'
              ? `땡! 정답은 ${problem.answer} — ${score}개 맞춤`
              : `시간 종료! ${score}개 맞춤`
            : '30초 안에, 틀리지 않고 최대한 많이!'}
      </p>

      {phase === 'playing' ? (
        <>
          <p className="math-q">{problem.text} = ?</p>
          <div className="math-options">
            {problem.options.map((o, i) => (
              <button key={i} className="math-opt" onClick={() => answer(o)}>
                {o}
              </button>
            ))}
          </div>
        </>
      ) : (
        <button className="primary-btn" onClick={start}>
          {phase === 'over' ? `다시 하기 (이번 ${score}개)` : '▶ 시작'}
        </button>
      )}

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(score)} disabled={phase !== 'over'}>
          기록 반영 ▶ {phase === 'over' ? `(${score}개)` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}개</p>
      )}
    </div>
  )
}
