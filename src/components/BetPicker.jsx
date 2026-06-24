import { useState } from 'react'
import { useMembers } from '../hooks/useMembers'
import MemberInput from './MemberInput'
import RandomPick from './bet/RandomPick'
import DrawLots from './bet/DrawLots'
import LadderGame from './bet/LadderGame'
import WheelGame from './bet/WheelGame'

const GAMES = [
  { key: 'random', label: '랜덤뽑기', icon: '🎯' },
  { key: 'lots', label: '제비뽑기', icon: '🎟️' },
  { key: 'ladder', label: '사다리', icon: '🪜' },
  { key: 'wheel', label: '룰렛', icon: '🎡' },
]

// "누가 쏠까" 컨테이너: 공유 멤버(useMembers) + 게임 방식 선택
export default function BetPicker() {
  const members = useMembers()
  const { names } = members
  const [game, setGame] = useState('random')

  return (
    <main className="content">
      <div className="bet">
        <h2 className="bet__title">누가 쏠까? ☕</h2>

        <MemberInput members={members} />

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
