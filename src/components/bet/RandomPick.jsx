import { useState } from 'react'

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// 랜덤뽑기: 이름이 빠르게 스쳐가다 1명 당첨
export default function RandomPick({ names }) {
  const [winner, setWinner] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [flash, setFlash] = useState(null)

  const spin = () => {
    if (names.length < 2 || spinning) return
    setSpinning(true)
    setWinner(null)
    let count = 0
    const timer = setInterval(() => {
      setFlash(pick(names))
      count += 1
      if (count >= 16) {
        clearInterval(timer)
        setFlash(null)
        setWinner(pick(names))
        setSpinning(false)
      }
    }, 80)
  }

  return (
    <div className="game">
      <button className="primary-btn" onClick={spin} disabled={names.length < 2 || spinning}>
        {spinning ? '돌리는 중…' : '🎯 돌리기'}
      </button>

      {(spinning || winner) && (
        <div className={`bet__result ${winner ? 'bet__result--done' : ''}`}>
          {spinning ? (
            <span className="bet__flash">{flash}</span>
          ) : (
            <>
              <span className="bet__winner">{winner}</span>
              <span className="bet__msg">님이 쏩니다! ☕</span>
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
