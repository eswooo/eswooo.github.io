import { useState } from 'react'
import RandomPick from './bet/RandomPick'
import DrawLots from './bet/DrawLots'
import LadderGame from './bet/LadderGame'
import WheelGame from './bet/WheelGame'

const MEMBERS_KEY = 'lunch:bet-members'
const ACTIVE_KEY = 'lunch:bet-active'
const LEGACY_KEY = 'lunch:bet-names'

const GAMES = [
  { key: 'random', label: '랜덤뽑기', icon: '🎯' },
  { key: 'lots', label: '제비뽑기', icon: '🎟️' },
  { key: 'ladder', label: '사다리', icon: '🪜' },
  { key: 'wheel', label: '룰렛', icon: '🎡' },
]

function parseNames(text) {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// 저장된 멤버 로스터 로드 (없으면 옛 textarea 데이터 마이그레이션)
function loadRoster() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    if (raw) return JSON.parse(raw)
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return parseNames(legacy)
  } catch {
    /* 무시 */
  }
  return []
}

function loadActive(roster) {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    /* 무시 */
  }
  return new Set(roster) // 기본: 전원 참여
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 무시 */
  }
}

// "누가 쏠까" 컨테이너: 멤버 칩 관리(추가/삭제/참여 토글) + 게임 방식 선택
export default function BetPicker() {
  const [roster, setRoster] = useState(loadRoster)
  const [active, setActive] = useState(() => loadActive(loadRoster()))
  const [draft, setDraft] = useState('')
  const [game, setGame] = useState('random')

  const names = roster.filter((n) => active.has(n)) // 오늘 참여자

  const addFromText = (txt) => {
    const toAdd = parseNames(txt)
    if (!toAdd.length) return
    setRoster((prev) => {
      const next = [...prev]
      toAdd.forEach((n) => {
        if (!next.includes(n)) next.push(n)
      })
      save(MEMBERS_KEY, next)
      return next
    })
    setActive((prev) => {
      const next = new Set(prev)
      toAdd.forEach((n) => next.add(n))
      save(ACTIVE_KEY, [...next])
      return next
    })
    setDraft('')
  }

  const toggle = (name) => {
    setActive((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      save(ACTIVE_KEY, [...next])
      return next
    })
  }

  const remove = (name) => {
    setRoster((prev) => {
      const next = prev.filter((n) => n !== name)
      save(MEMBERS_KEY, next)
      return next
    })
    setActive((prev) => {
      const next = new Set(prev)
      next.delete(name)
      save(ACTIVE_KEY, [...next])
      return next
    })
  }

  const setAll = (on) => {
    const next = on ? new Set(roster) : new Set()
    setActive(next)
    save(ACTIVE_KEY, [...next])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addFromText(draft)
    }
  }

  return (
    <main className="content">
      <div className="bet">
        <h2 className="bet__title">누가 쏠까? ☕</h2>

        <div className="member-add">
          <input
            className="member-add__input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="이름 입력 후 Enter"
          />
          <button className="member-add__btn" onClick={() => addFromText(draft)} disabled={!draft.trim()}>
            추가
          </button>
        </div>

        {roster.length > 0 ? (
          <>
            <div className="members">
              {roster.map((name) => (
                <span key={name} className={`member ${active.has(name) ? 'member--on' : ''}`}>
                  <button className="member__toggle" onClick={() => toggle(name)}>
                    {name}
                  </button>
                  <button className="member__del" onClick={() => remove(name)} title="멤버 삭제">
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="members-meta">
              <span className="bet__count">{names.length}명 참여</span>
              <span className="members-actions">
                <button className="link-btn" onClick={() => setAll(true)}>
                  모두 선택
                </button>
                <button className="link-btn" onClick={() => setAll(false)}>
                  모두 해제
                </button>
              </span>
            </div>
          </>
        ) : (
          <p className="bet__hint">이름을 추가해 멤버를 만들어 보세요. 다음엔 칩만 눌러 참여자를 고릅니다.</p>
        )}

        <div className="game-nav">
          {GAMES.map((g) => (
            <button
              key={g.key}
              className={`game-nav__btn ${game === g.key ? 'game-nav__btn--active' : ''}`}
              onClick={() => setGame(g.key)}
            >
              <span className="game-nav__icon">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>

        {names.length < 2 ? (
          <p className="bet__warn">참여자를 2명 이상 선택해 주세요.</p>
        ) : (
          <>
            {game === 'random' && <RandomPick key={names.join('|')} names={names} />}
            {game === 'lots' && <DrawLots key={names.join('|')} names={names} />}
            {game === 'ladder' && <LadderGame key={names.join('|')} names={names} />}
            {game === 'wheel' && <WheelGame key={names.join('|')} names={names} />}
          </>
        )}
      </div>
    </main>
  )
}
