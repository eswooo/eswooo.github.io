import { useState, useCallback } from 'react'

const W = 320
const H = 300
const PAD_X = 34
const TOP_Y = 40
const BOT_Y = H - 40

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 인접 칼럼 사이 가로 rung 랜덤 생성 (같은 행에서 칼럼 공유 금지)
function genRungs(cols, rows) {
  const set = new Set()
  for (let r = 0; r < rows; r++) {
    let c = 0
    while (c < cols - 1) {
      if (Math.random() < 0.5) {
        set.add(`${r},${c}`)
        c += 2 // 인접 rung 방지
      } else {
        c += 1
      }
    }
  }
  return set
}

// 모든 세로줄이 최소 한 번은 가로줄에 닿는지 (안 닿으면 '일자로 내려감')
function allColumnsTouched(set, cols) {
  const touched = new Set()
  for (const key of set) {
    const c = Number(key.split(',')[1])
    touched.add(c) // 칼럼 c
    touched.add(c + 1) // 칼럼 c+1
  }
  for (let c = 0; c < cols; c++) {
    if (!touched.has(c)) return false
  }
  return true
}

// 일자 내려가는 줄이 없도록, 모든 칼럼이 닿을 때까지 재생성
function buildRungs(cols, rows) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const set = genRungs(cols, rows)
    if (allColumnsTouched(set, cols)) return set
  }
  // 폴백: 안 닿은 칼럼에 가로줄을 강제로 추가
  const set = genRungs(cols, rows)
  for (let c = 0; c < cols; c++) {
    const touched = [...set].some((k) => {
      const cc = Number(k.split(',')[1])
      return cc === c || cc === c - 1
    })
    if (!touched) {
      const side = c < cols - 1 ? c : c - 1
      set.add(`${Math.floor(Math.random() * rows)},${side}`)
    }
  }
  return set
}

export default function LadderGame({ names }) {
  const cols = names.length
  const rows = Math.max(6, cols * 2)

  const make = useCallback(
    () => ({
      rungs: buildRungs(cols, rows),
      outcomes: shuffle(['쏘기', ...Array(Math.max(0, cols - 1)).fill('통과')]),
    }),
    [cols, rows],
  )

  const [ladder, setLadder] = useState(make)
  const [order, setOrder] = useState(names) // 상단 이름 순서
  const [selected, setSelected] = useState(null) // 시작 칼럼
  const [result, setResult] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const reset = () => {
    setLadder(make())
    setSelected(null)
    setResult(null)
    setShowAll(false)
  }

  const shuffleOrder = () => {
    setOrder((prev) => shuffle(prev))
    setSelected(null)
    setResult(null)
  }

  const colX = (j) => (cols === 1 ? W / 2 : PAD_X + (j * (W - 2 * PAD_X)) / (cols - 1))
  const rowY = (r) => TOP_Y + ((r + 1) * (BOT_Y - TOP_Y)) / (rows + 1)
  const hasRung = (r, c) => ladder.rungs.has(`${r},${c}`)

  // 시작 칼럼 → 경로 점들 + 도착 칼럼
  const trace = (start) => {
    const pts = [[colX(start), TOP_Y]]
    let cur = start
    for (let r = 0; r < rows; r++) {
      const y = rowY(r)
      if (cur > 0 && hasRung(r, cur - 1)) {
        pts.push([colX(cur), y], [colX(cur - 1), y])
        cur -= 1
      } else if (cur < cols - 1 && hasRung(r, cur)) {
        pts.push([colX(cur), y], [colX(cur + 1), y])
        cur += 1
      }
    }
    pts.push([colX(cur), BOT_Y])
    return { pts, end: cur }
  }

  const select = (start) => {
    const { end } = trace(start)
    setSelected(start)
    setResult({ name: order[start], outcome: ladder.outcomes[end] })
  }

  const path = selected != null ? trace(selected).pts : null

  // rung 좌표 목록 (그리기용)
  const rungLines = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (hasRung(r, c)) rungLines.push({ x1: colX(c), x2: colX(c + 1), y: rowY(r) })
    }
  }

  return (
    <div className="game">
      <p className="game__status">
        {result ? (
          result.outcome === '쏘기' ? (
            <>
              <span className="bet__winner">{result.name}</span>
              <span className="bet__msg">님이 쏩니다! ☕</span>
            </>
          ) : (
            <>
              <b>{result.name}</b>님 — 통과 🎉
            </>
          )
        ) : (
          <>위 이름을 눌러 사다리를 타세요</>
        )}
      </p>

      <svg className="ladder" viewBox={`0 0 ${W} ${H}`} role="img">
        {/* 세로줄 */}
        {names.map((_, j) => (
          <line key={`v${j}`} x1={colX(j)} y1={TOP_Y} x2={colX(j)} y2={BOT_Y} className="ladder__pole" />
        ))}
        {/* 가로 rung */}
        {rungLines.map((l, i) => (
          <line key={`r${i}`} x1={l.x1} y1={l.y} x2={l.x2} y2={l.y} className="ladder__rung" />
        ))}
        {/* 강조 경로 */}
        {path && (
          <polyline
            key={selected}
            className="ladder__path"
            points={path.map((p) => p.join(',')).join(' ')}
            pathLength="1"
          />
        )}
        {/* 상단 이름 (클릭) */}
        {order.map((n, j) => (
          <text
            key={`tn${j}`}
            x={colX(j)}
            y={TOP_Y - 14}
            className={`ladder__name ${selected === j ? 'ladder__name--sel' : ''}`}
            onClick={() => select(j)}
          >
            {n.length > 4 ? n.slice(0, 4) : n}
          </text>
        ))}
        {/* 하단 결과 */}
        {ladder.outcomes.map((o, j) => (
          <text
            key={`bo${j}`}
            x={colX(j)}
            y={BOT_Y + 22}
            className={`ladder__outcome ${o === '쏘기' ? 'ladder__outcome--hit' : ''}`}
          >
            {o === '쏘기' ? '쏘기☕' : '통과'}
          </text>
        ))}
      </svg>

      <div className="filter-actions">
        <button className="secondary-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? '결과 숨기기' : '👁 전체 결과 보기'}
        </button>
        <button className="secondary-btn" onClick={shuffleOrder}>
          🔀 순서 섞기
        </button>
        <button className="secondary-btn" onClick={reset}>
          🔁 새로 만들기
        </button>
      </div>

      {showAll && (
        <div className="ladder-results">
          {order.map((n, j) => {
            const outcome = ladder.outcomes[trace(j).end]
            const hit = outcome === '쏘기'
            return (
              <div key={j} className={`ladder-result ${hit ? 'ladder-result--hit' : ''}`}>
                <span className="ladder-result__name">{n}</span>
                <span className="ladder-result__arrow">→</span>
                <span className="ladder-result__outcome">{hit ? '쏘기 ☕' : '통과'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
