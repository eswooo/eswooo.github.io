import { useState } from 'react'
import { useMembers } from '../../hooks/useMembers'
import MemberInput from '../MemberInput'

const MEDAL = ['🥇', '🥈', '🥉']

function loadRecords(key) {
  try {
    const raw = localStorage.getItem(`mini:records:${key}`)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 무시 */
  }
  return {}
}

// 멀티플레이: 멤버를 골라 한 판씩 플레이 → 그 멤버 기록 갱신 → 하단 랭킹.
export default function MultiPlay({ game }) {
  const members = useMembers()
  const { names } = members
  const Comp = game.Comp

  const [records, setRecords] = useState(() => loadRecords(game.key))
  const [player, setPlayer] = useState(null) // 현재 플레이어
  const [playing, setPlaying] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const [last, setLast] = useState(null) // { name, score }

  const better = (a, b) => (game.lowerIsBetter ? a < b : a > b)

  const handleResult = (score) => {
    setRecords((prev) => {
      const cur = prev[player]
      const next = cur == null || better(score, cur) ? { ...prev, [player]: score } : prev
      try {
        localStorage.setItem(`mini:records:${game.key}`, JSON.stringify(next))
      } catch {
        /* 무시 */
      }
      return next
    })
    setLast({ name: player, score })
    setPlaying(false)
  }

  const startPlay = () => {
    if (!player) return
    setLast(null)
    setPlayCount((c) => c + 1)
    setPlaying(true)
  }

  const resetRecords = () => {
    setRecords({})
    try {
      localStorage.removeItem(`mini:records:${game.key}`)
    } catch {
      /* 무시 */
    }
  }

  // 랭킹: 기록 보유 멤버 정렬
  const ranking = Object.entries(records)
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => (game.lowerIsBetter ? a.score - b.score : b.score - a.score))

  if (playing) {
    return (
      <div className="game">
        <p className="game__status">
          <b>{player}</b>님 플레이 중 — {game.label}
        </p>
        <Comp key={playCount} onResult={handleResult} />
      </div>
    )
  }

  return (
    <div className="game">
      <MemberInput members={members} />

      {names.length === 0 ? (
        <p className="bet__warn">참여할 멤버를 추가/선택해 주세요.</p>
      ) : (
        <>
          <div className="player-pick">
            <span className="radius-label">플레이어</span>
            <div className="chip-row">
              {names.map((n) => (
                <button
                  key={n}
                  className={`chip ${player === n ? 'chip--active' : ''}`}
                  onClick={() => setPlayer(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button className="primary-btn" onClick={startPlay} disabled={!player}>
            ▶ {player ? `${player} 플레이` : '플레이어를 고르세요'}
          </button>
        </>
      )}

      {last && (
        <p className="game__status">
          <b>{last.name}</b> 기록: {game.format(last.score)}
        </p>
      )}

      <div className="ranking">
        <div className="ranking__head">
          <span>🏆 랭킹 ({game.label})</span>
          {ranking.length > 0 && (
            <button className="icon-btn" onClick={resetRecords} title="기록 초기화">
              🗑
            </button>
          )}
        </div>
        {ranking.length === 0 ? (
          <p className="bet__hint">아직 기록이 없어요. 멤버를 골라 플레이해 보세요.</p>
        ) : (
          <ol className="ranking__list">
            {ranking.map((r, i) => (
              <li key={r.name} className={`ranking__row ${i === 0 ? 'ranking__row--top' : ''}`}>
                <span className="ranking__rank">{MEDAL[i] || `${i + 1}.`}</span>
                <span className="ranking__name">{r.name}</span>
                <span className="ranking__score">{game.format(r.score)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
