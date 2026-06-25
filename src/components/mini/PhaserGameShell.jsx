import { useEffect, useRef, useState } from 'react'
import { loadPhaser } from '../../games/phaserLoader'

// Phaser 게임 공통 셸: 플레이 영역 탭으로 시작/다시 + 정리 + 싱글 best·멀티 onResult 연동.
// createGame(Phaser, parentEl, { width, height, onScore }) → Phaser.Game
export default function PhaserGameShell({ createGame, width, height, bestKey, suffix, hint, onResult }) {
  const [phase, setPhase] = useState('idle') // idle | loading | playing | over
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem(bestKey)) || 0)
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  const destroyGame = () => {
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }
  }
  useEffect(() => destroyGame, [])

  const handleScore = (s) => {
    setScore(s)
    setPhase('over')
    if (!onResult && s > best) {
      setBest(s)
      try {
        localStorage.setItem(bestKey, String(s))
      } catch {
        /* 무시 */
      }
    }
  }

  const start = async () => {
    if (phase === 'loading' || phase === 'playing') return
    setPhase('loading')
    const Phaser = await loadPhaser()
    if (!containerRef.current) return
    destroyGame()
    gameRef.current = createGame(Phaser, containerRef.current, { width, height, onScore: handleScore })
    setPhase('playing')
  }

  const overlayTap = phase === 'idle' || phase === 'over' ? start : undefined

  return (
    <div className="game">
      <div className="phaser-wrap" style={{ aspectRatio: `${width} / ${height}` }}>
        <div ref={containerRef} className="phaser-box" />
        {phase !== 'playing' && (
          <div className="phaser-overlay" onClick={overlayTap}>
            {phase === 'idle' && (
              <>
                <span className="phaser-overlay__big">▶</span>
                <span>{hint}</span>
                <span>화면을 탭하면 시작</span>
              </>
            )}
            {phase === 'loading' && <span>불러오는 중…</span>}
            {phase === 'over' && (
              <>
                <span className="phaser-overlay__big">{score}{suffix}</span>
                <span>탭해서 다시 하기</span>
              </>
            )}
          </div>
        )}
      </div>

      {onResult ? (
        <button className="primary-btn" onClick={() => onResult(score)} disabled={phase !== 'over'}>
          기록 반영 ▶ {phase === 'over' ? `(${score}${suffix})` : ''}
        </button>
      ) : (
        <p className="mini-best">최고 기록: {best}{suffix}</p>
      )}
    </div>
  )
}
