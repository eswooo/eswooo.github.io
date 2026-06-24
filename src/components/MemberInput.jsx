import { useState } from 'react'

// 멤버 칩 입력 UI (useMembers 훅 결과를 받아 렌더). '누가 쏠까'/멀티 미니게임 공용.
export default function MemberInput({ members }) {
  const { roster, active, names, add, toggle, remove, setAll } = members
  const [draft, setDraft] = useState('')

  const submit = () => {
    add(draft)
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <>
      <div className="member-add">
        <input
          className="member-add__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="이름 입력 후 Enter"
        />
        <button className="member-add__btn" onClick={submit} disabled={!draft.trim()}>
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
              <button className="pill-btn" onClick={() => setAll(true)}>
                모두 선택
              </button>
              <button className="pill-btn" onClick={() => setAll(false)}>
                모두 해제
              </button>
            </span>
          </div>
        </>
      ) : (
        <p className="bet__hint">이름을 추가해 멤버를 만들어 보세요. 다음엔 칩만 눌러 참여자를 고릅니다.</p>
      )}
    </>
  )
}
