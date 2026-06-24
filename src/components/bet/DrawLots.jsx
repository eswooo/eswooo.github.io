import { useState, useCallback } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 제비뽑기: 사람이 순서대로 제비를 뽑아 '쏘기'를 뽑은 사람이 당첨
export default function DrawLots({ names }) {
  const build = useCallback(() => {
    const outcomes = ['쏘기', ...Array(Math.max(0, names.length - 1)).fill('통과')]
    return shuffle(outcomes) // 카드 i의 숨겨진 결과
  }, [names.length])

  const [order, setOrder] = useState(names) // 뽑는 순서
  const [pool, setPool] = useState(build)
  const [assigned, setAssigned] = useState({}) // cardIndex -> name
  const [turn, setTurn] = useState(0)
  const [loser, setLoser] = useState(null)

  const reset = () => {
    setPool(build())
    setAssigned({})
    setTurn(0)
    setLoser(null)
  }

  const shuffleOrder = () => {
    setOrder((prev) => shuffle(prev))
    reset()
  }

  const drawCard = (i) => {
    if (loser || assigned[i] || turn >= order.length) return
    const drawer = order[turn]
    setAssigned((m) => ({ ...m, [i]: drawer }))
    if (pool[i] === '쏘기') {
      setLoser(drawer)
    } else {
      setTurn((t) => t + 1)
    }
  }

  return (
    <div className="game">
      <p className="game__status">
        {loser ? (
          <>
            <span className="bet__winner">{loser}</span>
            <span className="bet__msg">님이 쏩니다! ☕</span>
          </>
        ) : (
          <>
            <b>{order[turn]}</b>님 차례 — 제비를 뽑으세요
          </>
        )}
      </p>

      <div className="order-row">
        <span className="order-row__label">순서</span>
        <span className="order-row__names">{order.join(' → ')}</span>
      </div>

      <div className="lots">
        {pool.map((outcome, i) => {
          const who = assigned[i]
          const flipped = Boolean(who)
          const isHit = outcome === '쏘기'
          return (
            <button
              key={i}
              className={`lot ${flipped ? 'lot--open' : ''} ${flipped && isHit ? 'lot--hit' : ''}`}
              onClick={() => drawCard(i)}
              disabled={flipped || Boolean(loser)}
            >
              {flipped ? (
                <span className="lot__face">
                  <span className="lot__name">{who}</span>
                  <span className="lot__outcome">{isHit ? '쏘기 ☕' : '통과'}</span>
                </span>
              ) : (
                <span className="lot__back">?</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="filter-actions">
        <button className="secondary-btn" onClick={shuffleOrder}>
          🔀 순서 섞기
        </button>
        <button className="secondary-btn" onClick={reset}>
          🔁 다시 시작
        </button>
      </div>
    </div>
  )
}
