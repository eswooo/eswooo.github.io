import { useState } from 'react'

// 디폴트 카페 목록 (삭제 불가, 켜고 끄기만). 사용자가 임의로 추가 가능.
const DEFAULT_CAFES = ['스템', '베버리지', '프롬', '메가', 'nice', 'dcp', '랑온', '매머드', '스벅', '투썸', '빽다방']
const ACTIVE_KEY = 'lunch:cafe-active'
const CUSTOM_KEY = 'lunch:cafe-custom'

function loadCustom() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 무시 */
  }
  return []
}

function loadActive() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    /* 무시 */
  }
  return new Set(DEFAULT_CAFES) // 기본: 디폴트 전부 포함
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 무시 */
  }
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// 카페 랜덤뽑기: 디폴트 + 직접 추가한 카페 중 켜둔 것에서 한 곳을 룰렛처럼 뽑는다.
export default function CafePick() {
  const [custom, setCustom] = useState(loadCustom)
  const [active, setActive] = useState(loadActive)
  const [draft, setDraft] = useState('')
  const [winner, setWinner] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [flash, setFlash] = useState(null)

  const all = [...DEFAULT_CAFES, ...custom]
  const pool = all.filter((c) => active.has(c))

  const add = () => {
    const name = draft.trim()
    if (!name) return
    setDraft('')
    if (!all.includes(name)) {
      setCustom((prev) => {
        const next = [...prev, name]
        save(CUSTOM_KEY, next)
        return next
      })
    }
    setActive((prev) => {
      const next = new Set(prev)
      next.add(name)
      save(ACTIVE_KEY, [...next])
      return next
    })
    setWinner(null)
  }

  const toggle = (c) => {
    if (spinning) return
    setActive((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      save(ACTIVE_KEY, [...next])
      return next
    })
    setWinner(null)
  }

  const remove = (c) => {
    setCustom((prev) => {
      const next = prev.filter((x) => x !== c)
      save(CUSTOM_KEY, next)
      return next
    })
    setActive((prev) => {
      const next = new Set(prev)
      next.delete(c)
      save(ACTIVE_KEY, [...next])
      return next
    })
    setWinner(null)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
  }

  const spin = () => {
    if (pool.length < 2 || spinning) return
    setSpinning(true)
    setWinner(null)
    let count = 0
    const timer = setInterval(() => {
      setFlash(pick(pool))
      count += 1
      if (count >= 16) {
        clearInterval(timer)
        setFlash(null)
        setWinner(pick(pool))
        setSpinning(false)
      }
    }, 80)
  }

  return (
    <div className="game">
      <div className="member-add">
        <input
          className="member-add__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="카페 추가 후 Enter"
        />
        <button className="member-add__btn" onClick={add} disabled={!draft.trim()}>
          추가
        </button>
      </div>

      <p className="bet__hint">돌릴 카페만 켜두세요 (칩 탭으로 켜고 끄기, 추가한 건 ✕로 삭제)</p>
      <div className="members">
        {all.map((c) => {
          const isCustom = custom.includes(c)
          return (
            <span key={c} className={`member ${active.has(c) ? 'member--on' : ''}`}>
              <button
                className={`member__toggle ${isCustom ? '' : 'member__toggle--solo'}`}
                onClick={() => toggle(c)}
              >
                {c}
              </button>
              {isCustom && (
                <button className="member__del" onClick={() => remove(c)} title="삭제">
                  ✕
                </button>
              )}
            </span>
          )
        })}
      </div>

      <button className="primary-btn" onClick={spin} disabled={pool.length < 2 || spinning}>
        {spinning ? '뽑는 중…' : '☕ 돌리기'}
      </button>
      {pool.length < 2 && <p className="bet__warn">2곳 이상 켜 주세요.</p>}

      {(spinning || winner) && (
        <div className={`bet__result ${winner ? 'bet__result--done' : ''}`}>
          {spinning ? (
            <span className="bet__flash">{flash}</span>
          ) : (
            <>
              <span className="bet__winner">{winner}</span>
              <span className="bet__msg">로 가자! ☕</span>
            </>
          )}
        </div>
      )}

      {winner && !spinning && (
        <button className="secondary-btn" onClick={spin}>
          🔁 다시 돌리기
        </button>
      )}
    </div>
  )
}
