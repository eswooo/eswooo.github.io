import { useCallback, useState } from 'react'
import { LocationContext } from './context/LocationContext'
import { addRecentLocation } from './lib/recentLocations'
import LocationGate from './components/LocationGate'
import TabNav from './components/TabNav'
import RouletteTab from './components/RouletteTab'
import FilterTab from './components/FilterTab'
import ListTab from './components/ListTab'
import BetPicker from './components/BetPicker'
import MiniGames from './components/MiniGames'
import './App.css'

const TABS = [
  { key: 'roulette', label: '랜덤 룰렛', icon: '🎲' },
  { key: 'filter', label: '필터 추천', icon: '🍽️' },
  { key: 'list', label: '목록', icon: '📋' },
]

export default function App() {
  const [mode, setMode] = useState('lunch') // 'lunch' | 'bet' | 'mini'
  const [location, setLocation] = useState(null) // { coords, label }
  const [tab, setTab] = useState('roulette')

  // 위치 확정 시 최근 위치로 기록 후 적용
  const handleReady = useCallback(({ coords, label }) => {
    addRecentLocation({ label, lat: coords.lat, lng: coords.lng })
    setLocation({ coords, label })
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>오늘 점심 뭐 먹지? 🍚</h1>
        {mode === 'lunch' && location && (
          <button className="loc-badge" onClick={() => setLocation(null)} title="위치 변경">
            📍 {location.label}
          </button>
        )}
      </header>

      <div className="mode-switch">
        <button
          className={`mode-switch__btn ${mode === 'lunch' ? 'mode-switch__btn--active' : ''}`}
          onClick={() => setMode('lunch')}
        >
          🍚 점심 추천
        </button>
        <button
          className={`mode-switch__btn ${mode === 'bet' ? 'mode-switch__btn--active' : ''}`}
          onClick={() => setMode('bet')}
        >
          ☕ 누가 쏠까
        </button>
        <button
          className={`mode-switch__btn ${mode === 'mini' ? 'mode-switch__btn--active' : ''}`}
          onClick={() => setMode('mini')}
        >
          🎮 미니게임
        </button>
      </div>

      {mode === 'mini' ? (
        <MiniGames />
      ) : mode === 'bet' ? (
        <BetPicker />
      ) : !location ? (
        <LocationGate onReady={handleReady} />
      ) : (
        <LocationContext.Provider value={location}>
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
          <main className="content">
            {tab === 'roulette' && <RouletteTab />}
            {tab === 'filter' && <FilterTab />}
            {tab === 'list' && <ListTab />}
          </main>
        </LocationContext.Provider>
      )}

      <footer className="app-footer">데이터 제공 · 카카오맵</footer>
    </div>
  )
}
